const CATEGORIES = require('../../constants/categories');
const { validateProductQuery } = require('./product.validation');
const { getProducts, getEstimatedCount } = require('./product.service');

// Cache estimated count at startup — refreshed periodically, never per-request
let cachedEstimatedCount = null;

async function refreshEstimatedCount() {
  try {
    cachedEstimatedCount = await getEstimatedCount();
  } catch {
    // Silently keep the last known value
  }
}

// Refresh every 60 seconds
setInterval(refreshEstimatedCount, 60_000);

/**
 * GET /api/products
 * Cursor-based paginated product listing with optional category filter.
 */
async function listProducts(req, res, next) {
  try {
    const params = validateProductQuery(req.query);
    const result = await getProducts(params);

    // Lazily initialize cached count on first request
    if (cachedEstimatedCount === null) {
      await refreshEstimatedCount();
    }

    return res.json({
      success: true,
      data: result.data,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
      estimatedTotal: cachedEstimatedCount,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/categories
 * Returns the fixed category list — no DB query needed.
 */
async function listCategories(_req, res) {
  return res.json({
    success: true,
    data: CATEGORIES,
  });
}

module.exports = { listProducts, listCategories };
