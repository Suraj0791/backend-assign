/**
 * Standard error response format
 * @param {string} message - Error message
 * @param {number} code - HTTP status code
 * @param {object} [data] - Additional error data
 * @returns {object} Formatted error response
 */
const errorResponse = (message, code, data = {}) => {
  return {
    status: "error",
    message,
    code,
    ...data,
  };
};

/**
 * Standard success response format
 * @param {string} message - Success message
 * @param {object} [data] - Response data
 * @param {number} [code=200] - HTTP status code
 * @returns {object} Formatted success response
 */
const successResponse = (message, data = {}, code = 200) => {
  return {
    status: "success",
    message,
    code,
    data,
  };
};

module.exports = {
  errorResponse,
  successResponse,
};
