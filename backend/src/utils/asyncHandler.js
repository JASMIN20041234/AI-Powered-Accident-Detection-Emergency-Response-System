/**
 * Wraps async route handlers so unhandled rejections are forwarded to Express
 * error middleware — eliminates repetitive try/catch in every controller.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
