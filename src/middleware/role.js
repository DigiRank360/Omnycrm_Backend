const ApiError = require('../utils/ApiError')

// Role-based access: authorize(ROLES.ADMIN, ...) – must run after protect
exports.authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) throw ApiError.forbidden()
  next()
}
