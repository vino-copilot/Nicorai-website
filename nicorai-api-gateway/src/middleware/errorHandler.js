/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(message, statusCode, errorCode = null, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Factory functions to create standard error types
 */
const ErrorTypes = {
  badRequest: (message = 'Bad Request', details = null) => 
    new ApiError(message, 400, 'BAD_REQUEST', details),
  
  unauthorized: (message = 'Unauthorized', details = null) => 
    new ApiError(message, 401, 'UNAUTHORIZED', details),
  
  forbidden: (message = 'Forbidden', details = null) => 
    new ApiError(message, 403, 'FORBIDDEN', details),
  
  notFound: (message = 'Not Found', details = null) => 
    new ApiError(message, 404, 'NOT_FOUND', details),
  
  methodNotAllowed: (message = 'Method Not Allowed', details = null) => 
    new ApiError(message, 405, 'METHOD_NOT_ALLOWED', details),
  
  conflict: (message = 'Conflict', details = null) => 
    new ApiError(message, 409, 'CONFLICT', details),
  
  unprocessableEntity: (message = 'Unprocessable Entity', details = null) => 
    new ApiError(message, 422, 'UNPROCESSABLE_ENTITY', details),
  
  tooManyRequests: (message = 'Too Many Requests', details = null) => 
    new ApiError(message, 429, 'TOO_MANY_REQUESTS', details),
  
  internalServer: (message = 'Internal Server Error', details = null) => 
    new ApiError(message, 500, 'INTERNAL_SERVER_ERROR', details),
  
  notImplemented: (message = 'Not Implemented', details = null) => 
    new ApiError(message, 501, 'NOT_IMPLEMENTED', details),
  
  serviceUnavailable: (message = 'Service Unavailable', details = null) => 
    new ApiError(message, 503, 'SERVICE_UNAVAILABLE', details)
};

/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  // Extract request information for logging
  const requestInfo = {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent') || 'unknown',
    timestamp: new Date().toISOString()
  };
  
  // Default status code and error information
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'Internal Server Error';
  const details = err.details || null;
  
  // Determine environment and adjust response accordingly
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Create detailed error log
  console.error(`❌ [${requestInfo.timestamp}] ERROR: ${statusCode} ${errorCode} - ${message}`);
  console.error(`🔍 Request: ${requestInfo.method} ${requestInfo.path} from ${requestInfo.ip}`);
  
  if (err.stack && !isProduction) {
    console.error(`📚 Stack: ${err.stack}`);
  }
  
  if (details) {
    console.error(`📋 Details:`, details);
  }
  
  // Send appropriate error response based on environment
  const errorResponse = {
    error: {
      message,
      status: statusCode,
      code: errorCode,
      timestamp: requestInfo.timestamp,
      path: requestInfo.path
    }
  };
  
  // Add details if they exist and we're not in production
  if (details && !isProduction) {
    errorResponse.error.details = details;
  }
  
  // Add stack trace in development mode
  if (!isProduction && err.stack) {
    errorResponse.error.stack = err.stack.split('\n');
  }
  
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 handler for undefined routes
 */
function notFoundHandler(req, res, next) {
  const error = ErrorTypes.notFound(`Route not found: ${req.originalUrl}`);
  next(error); // Pass to the main error handler
}

/**
 * Method not allowed handler
 * Creates a middleware that only allows specific HTTP methods
 * @param {Array<string>} allowedMethods - Array of allowed HTTP methods (e.g., ['GET', 'POST'])
 * @returns {Function} Middleware function
 */
function methodNotAllowedHandler(allowedMethods = []) {
  return (req, res, next) => {
    if (!allowedMethods.includes(req.method)) {
      const error = ErrorTypes.methodNotAllowed(
        `Method ${req.method} not allowed for ${req.originalUrl}. Allowed methods: ${allowedMethods.join(', ')}`
      );
      return next(error);
    }
    next();
  };
}

/**
 * Async handler to catch errors in async routes
 * Eliminates the need for try/catch blocks in route handlers
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  ApiError,
  ErrorTypes,
  errorHandler,
  notFoundHandler,
  methodNotAllowedHandler,
  asyncHandler
}; 