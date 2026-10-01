const authService = require("../services/auth.service");

function authenticate(req, res, next) {
  try {
    const headerToken = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7) : null;
    req.user = authService.verifyToken(headerToken || req.cookies?.hotel_token);
    next();
  } catch (error) {
    error.statusCode = 401;
    next(error);
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const error = new Error("You are not authorized for this action");
      error.statusCode = 403;
      return next(error);
    }
    next();
  };
}

module.exports = { authenticate, authorize };
