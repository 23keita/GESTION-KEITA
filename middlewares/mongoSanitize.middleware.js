/**
 * Middleware to sanitize user input (req.body, req.query, req.params)
 * to prevent NoSQL injection attacks against MongoDB.
 * It recursively removes any keys that start with '$' or contain '.'.
 *
 * This is a replacement for the 'express-mongo-sanitize' package,
 * which is not compatible with Express 5+ because it tries to reassign
 * req.query, which is a getter-only property. This middleware modifies
 * the objects in-place.
 */
const sanitizeValue = (value) => {
  // If it's not an object or array, do nothing
  if (value === null || typeof value !== 'object') {
    return;
  }

  // If it's an array, sanitize each element
  if (Array.isArray(value)) {
    value.forEach(sanitizeValue);
    return;
  }

  // If it's an object, sanitize its keys and values
  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      // Remove keys that start with '$' or contain '.'
      if (key.startsWith('$') || key.includes('.')) {
        delete value[key];
      } else {
        // Recurse for nested objects/arrays
        sanitizeValue(value[key]);
      }
    }
  }
};

const mongoSanitizeMiddleware = (req, res, next) => {
  if (req.body) sanitizeValue(req.body);
  if (req.query) sanitizeValue(req.query);
  if (req.params) sanitizeValue(req.params);
  next();
};

module.exports = mongoSanitizeMiddleware;
