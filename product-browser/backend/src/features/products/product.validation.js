const CATEGORIES = require('../../constants/categories');

/**
 * Validate and sanitize query parameters for the products endpoint.
 * Returns a clean object; throws a descriptive error on invalid input.
 */
function validateProductQuery(query) {
  const { cursor, limit, category } = query;

  // --- limit ---
  let parsedLimit = 20; // default
  if (limit !== undefined) {
    parsedLimit = parseInt(limit, 10);
    if (Number.isNaN(parsedLimit) || parsedLimit < 1) {
      parsedLimit = 20;
    }
    // Clamp to server-side max
    if (parsedLimit > 100) {
      parsedLimit = 100;
    }
  }

  // --- category ---
  let parsedCategory = null;
  if (category && typeof category === 'string' && category.trim().length > 0) {
    const trimmed = category.trim();
    if (!CATEGORIES.includes(trimmed)) {
      const error = new Error(`Invalid category: "${trimmed}"`);
      error.status = 400;
      throw error;
    }
    parsedCategory = trimmed;
  }

  // --- cursor (opaque string — basic shape validation only) ---
  let parsedCursor = null;
  if (cursor && typeof cursor === 'string' && cursor.trim().length > 0) {
    parsedCursor = cursor.trim();
  }

  return {
    cursor: parsedCursor,
    limit: parsedLimit,
    category: parsedCategory,
  };
}

module.exports = { validateProductQuery };
