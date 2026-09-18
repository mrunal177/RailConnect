const { verifyToken } = require('../utils/security');
const { createError } = require('../utils/http');

// Person 1 module: token verification and role enforcement.

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next(createError(401, 'Authentication token is required'));
  try {
    const payload = verifyToken(authHeader.slice(7));
    req.user = { id: payload.id, role: payload.role, name: payload.name, email: payload.email };
    next();
  } catch (error) {
    next(createError(401, error.message));
  }
};

const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return next(createError(403, 'Administrator access is required'));
};

module.exports = {
  authenticateUser,
  authorizeAdmin,
};
