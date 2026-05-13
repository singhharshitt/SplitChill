/**
 * Pagination Utilities for Cursor-Based Pagination
 * File: server/src/utils/pagination.js
 */

const mongoose = require('mongoose');

/**
 * Encode cursor to Base64 (type-safe)
 * @param {object} data - Cursor data { id, direction }
 * @returns {string|null} Base64 encoded cursor
 */
function encodeCursor(data) {
  if (!data) return null;
  const str = JSON.stringify(data);
  return Buffer.from(str, 'utf-8').toString('base64');
}

/**
 * Decode cursor from Base64
 * @param {string} encodedCursor - Base64 encoded cursor
 * @returns {object|null} Decoded cursor data
 */
function decodeCursor(encodedCursor) {
  if (!encodedCursor) return null;
  try {
    const str = Buffer.from(encodedCursor, 'base64').toString('utf-8');
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

/**
 * Build MongoDB query condition for cursor pagination
 * @param {string|ObjectId} cursorId - ObjectId of the last document
 * @param {string} direction - "older" (default) or "newer"
 * @returns {object} MongoDB query condition
 */
function buildCursorQuery(cursorId, direction = 'older') {
  if (!cursorId) return {};
  
  try {
    const objectId = mongoose.Types.ObjectId.isValid(cursorId)
      ? new mongoose.Types.ObjectId(cursorId)
      : cursorId;
    
    return direction === 'newer' 
      ? { _id: { $gt: objectId } }
      : { _id: { $lt: objectId } };
  } catch (e) {
    return {};
  }
}

/**
 * Paginate a MongoDB query using cursor-based pagination
 * @param {Query} query - Mongoose query object
 * @param {object} options - Configuration options
 * @param {number} options.limit - Number of items per page (default: 20, max: 100)
 * @param {string} options.cursor - Encoded cursor from previous response
 * @param {string} options.direction - "older" or "newer" (default: "older")
 * @param {number} options.sortOrder - 1 for asc, -1 for desc (default: -1)
 * @returns {Promise<object>} { items, hasMore, nextCursor, count }
 */
async function paginate(query, options = {}) {
  const {
    limit = 20,
    cursor,
    direction = 'older',
    sortOrder = -1,
  } = options;

  // Validate and constrain limit
  const pageLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  // Parse cursor if provided
  let cursorData = null;
  if (cursor) {
    cursorData = decodeCursor(cursor);
  }

  // Build cursor condition
  const cursorCondition = cursorData 
    ? buildCursorQuery(cursorData.id, direction)
    : {};

  // Create a fresh query clone and apply cursor condition
  let finalQuery = query.clone();
  if (Object.keys(cursorCondition).length > 0) {
    finalQuery = finalQuery.where(cursorCondition);
  }

  // Fetch limit + 1 to determine if there are more items
  const items = await finalQuery
    .sort({ _id: sortOrder })
    .limit(pageLimit + 1)
    .lean(); // Use lean() for faster queries on read-only data

  // Determine if there are more items
  const hasMore = items.length > pageLimit;
  
  // Return only the requested page
  const paginatedItems = items.slice(0, pageLimit);

  // Generate next cursor for the last item in this page
  let nextCursor = null;
  if (hasMore && paginatedItems.length > 0) {
    const lastItem = paginatedItems[paginatedItems.length - 1];
    nextCursor = encodeCursor({
      id: lastItem._id.toString(),
      direction: 'older'
    });
  }

  return {
    items: paginatedItems,
    hasMore,
    nextCursor,
    count: paginatedItems.length
  };
}

/**
 * Build standardized pagination response
 * @param {array} items - Array of items
 * @param {string} nextCursor - Encoded cursor for next page
 * @param {string} endpoint - API endpoint path
 * @param {number} limit - Items per page
 * @returns {object} Formatted response
 */
function buildPaginationResponse(items, nextCursor, endpoint, limit) {
  const separator = endpoint.includes("?") ? "&" : "?";
  return {
    items,
    pagination: {
      hasMore: nextCursor !== null,
      nextCursor,
      nextUrl: nextCursor 
        ? `${endpoint}${separator}limit=${limit}&cursor=${nextCursor}`
        : null,
      count: items.length
    }
  };
}

/**
 * Validate cursor format
 * @param {string} cursor - Encoded cursor to validate
 * @returns {boolean} True if valid
 */
function isValidCursor(cursor) {
  if (!cursor) return true; // null/undefined is valid (first page)
  const decoded = decodeCursor(cursor);
  return decoded && decoded.id && mongoose.Types.ObjectId.isValid(decoded.id);
}

module.exports = {
  encodeCursor,
  decodeCursor,
  buildCursorQuery,
  paginate,
  buildPaginationResponse,
  isValidCursor
};
