/**
 * 404 handler for unmatched routes.
 * Must be registered after all valid route handlers.
 */
function notFound(req, res, _next) {
  res.status(404).json({
    success: false,
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
}

module.exports = notFound;
