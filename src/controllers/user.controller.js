const User = require('../models/User')
const ApiError = require('../utils/ApiError')

exports.list = async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 })
  res.json({ success: true, data: users })
}

exports.create = async (req, res) => {
  if (await User.exists({ email: req.body.email.toLowerCase() })) throw ApiError.conflict('Email already in use')
  const user = await User.create(req.body)
  res.status(201).json({ success: true, user })
}

exports.update = async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) throw ApiError.notFound('User not found')

  // An admin must not lock themselves out
  const self = String(user._id) === String(req.user._id)
  if (self && (req.body.isActive === false || (req.body.role && req.body.role !== user.role))) {
    throw ApiError.badRequest('You cannot disable or change the role of your own account')
  }

  Object.assign(user, req.body)
  await user.save()
  res.json({ success: true, user })
}
