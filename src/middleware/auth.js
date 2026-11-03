const jwt = require('jsonwebtoken')
const env = require('../config/env')
const User = require('../models/User')
const ApiError = require('../utils/ApiError')

// Verifies the Bearer token and attaches the user to req.user
exports.protect = async (req, _res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) throw ApiError.unauthorized()

  let payload
  try {
    payload = jwt.verify(token, env.jwtSecret)
  } catch {
    throw ApiError.unauthorized('Invalid or expired token')
  }

  const user = await User.findById(payload.id)
  if (!user || !user.isActive) throw ApiError.unauthorized('User no longer exists or is disabled')
  req.user = user
  next()
}
