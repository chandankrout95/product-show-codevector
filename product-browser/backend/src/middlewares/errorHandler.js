/**
 * Global error handler middleware.
 * Catches all errors forwarded via next(error) and returns a structured JSON response.
 */
function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;

  // Log server errors for debugging
  if (status >= 500) {
    console.error(`[ERROR] ${err.message}`, err.stack);
  }

  res.status(status).json({
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}

module.exports = errorHandler;
