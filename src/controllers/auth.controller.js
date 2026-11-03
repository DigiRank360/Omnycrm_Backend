const jwt = require('jsonwebtoken')
const env = require('../config/env')
const User = require('../models/User')
const ApiError = require('../utils/ApiError')

const signToken = (user) => jwt.sign({ id: user._id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn })

exports.login = async (req, res) => {
  const { email, password, role } = req.body
  const user = await User.findOne({ email }).select('+password')
  if (!user || !user.isActive || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password')
  }
  // Role chosen on the login screen must match the account's role
  if (role && user.role !== role) {
    throw ApiError.unauthorized('This account does not belong to the selected role')
  }
  res.json({ success: true, token: signToken(user), user })
}

exports.me = (req, res) => {
  res.json({ success: true, user: req.user })
}
