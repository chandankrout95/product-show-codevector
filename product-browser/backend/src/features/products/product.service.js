const mongoose = require('mongoose');
const Product = require('./product.model');

// ---------------------------------------------------------------------------
// Cursor encoding / decoding
// ---------------------------------------------------------------------------

/**
 * Encode a cursor from the last product in a result set.
 * The cursor is an opaque base64-encoded JSON string carrying the sort-key
 * values needed to resume pagination from this exact point.
 */
function encodeCursor(product) {
  const payload = JSON.stringify({
    createdAt: product.createdAt instanceof Date
      ? product.createdAt.toISOString()
      : product.createdAt,
    id: product._id.toString(),
  });
  return Buffer.from(payload).toString('base64');
}

/**
 * Decode a cursor string back into its constituent sort-key values.
 * Returns null for invalid or missing cursors.
 */
function decodeCursor(cursorStr) {
  if (!cursorStr) return null;

  try {
    const decoded = Buffer.from(cursorStr, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);

    if (!parsed.createdAt || !parsed.id) return null;

    return {
      createdAt: new Date(parsed.createdAt),
      id: new mongoose.Types.ObjectId(parsed.id),
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Query building
// ---------------------------------------------------------------------------

/**
 * Build the MongoDB filter for the next page of results.
 *
 * Keyset condition (decoded from the cursor):
 *   $or: [
 *     { createdAt: { $lt: cursor.createdAt } },
 *     { createdAt: cursor.createdAt, _id: { $lt: cursor.id } }
 *   ]
 *
 * This is a direct index range scan — O(log n) to locate the start position
 * plus O(limit) to read the requested rows. Unlike OFFSET, which must walk
 * and discard every skipped row, this cost is constant regardless of depth.
 *
 * The _id tiebreaker ensures a strictly total order: even if many products
 * share the same createdAt value, each one occupies a unique position in the
 * sort and will never be duplicated or skipped.
 */
function buildCursorQuery(cursor, category) {
  const filter = {};

  // Category equality filter (uses the compound index prefix)
  if (category) {
    filter.category = category;
  }

  // Keyset "seek" condition
  if (cursor) {
    filter.$or = [
      { createdAt: { $lt: cursor.createdAt } },
      { createdAt: { $eq: cursor.createdAt }, _id: { $lt: cursor.id } },
    ];
  }

  return filter;
}

// ---------------------------------------------------------------------------
// Main query
// ---------------------------------------------------------------------------

/**
 * Fetch a page of products using cursor-based (keyset) pagination.
 *
 * Implementation notes:
 * - Fetches limit + 1 rows to determine `hasMore` without a second query.
 * - Uses .lean() for read-only, un-hydrated documents (faster).
 * - Projects only the fields the UI needs.
 * - Never calls countDocuments() — that's a full-scan equivalent at 200k docs.
 */
async function getProducts({ cursor: cursorStr, limit = 20, category } = {}) {
  const cursor = decodeCursor(cursorStr);
  const filter = buildCursorQuery(cursor, category);

  const docs = await Product.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .select('name category price createdAt')
    .lean()
    .exec();

  const hasMore = docs.length > limit;
  const data = hasMore ? docs.slice(0, limit) : docs;

  const nextCursor = hasMore ? encodeCursor(data[data.length - 1]) : null;

  return { data, nextCursor, hasMore };
}

/**
 * Get an approximate total product count (cached at the app layer).
 * Uses estimatedDocumentCount() which reads collection metadata — O(1),
 * no collection scan.
 */
async function getEstimatedCount() {
  return Product.estimatedDocumentCount();
}

module.exports = {
  encodeCursor,
  decodeCursor,
  buildCursorQuery,
  getProducts,
  getEstimatedCount,
};
