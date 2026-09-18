const createError = (statusCode, message) => Object.assign(new Error(message), { statusCode });

const requireFields = (body, fields) => {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
  if (missing.length) throw createError(400, `Missing required field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`);
};

module.exports = { createError, requireFields };
