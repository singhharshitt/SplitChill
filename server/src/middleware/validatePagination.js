/**
 * Pagination Validation Middleware
 * File: server/src/middleware/validatePagination.js
 */

const { isValidCursor } = require('../utils/paginationUtils');
const AppError = require('../utils/appError');

/**
 * Middleware to validate and normalize pagination query parameters
 * Attaches validated params to req.pagination
 */
function validatePagination(req, res, next) {
  try {
    const { limit, cursor } = req.query;

    // Validate limit
    let pageLimit = 20; // default
    if (limit) {
      const parsed = parseInt(limit, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 100) {
        throw new AppError('Invalid limit. Must be between 1 and 100', 400);
      }
      pageLimit = parsed;
    }

    // Validate cursor
    if (cursor && !isValidCursor(cursor)) {
      throw new AppError('Invalid cursor format', 400);
    }

    // Attach to request for controller use
    req.pagination = {
      limit: pageLimit,
      cursor: cursor || null
    };

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = validatePagination;
