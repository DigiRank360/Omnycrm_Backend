const multer = require('multer')
const env = require('../config/env')

exports.notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` })
}

// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, _req, res, _next) => {
  let status = err.statusCode || 500
  let message = err.message || 'Internal server error'
  let details = err.details

  if (err.name === 'ValidationError') {
    status = 400
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }))
    message = 'Validation failed'
  } else if (err.name === 'CastError') {
    status = 400
    message = `Invalid ${err.path}`
  } else if (err.code === 11000) {
    status = 409
    message = `Duplicate value for ${Object.keys(err.keyValue || {}).join(', ')}`
  } else if (err instanceof multer.MulterError) {
    status = 400
  }

  if (status >= 500) console.error(err)

  res.status(status).json({
    success: false,
    message: status >= 500 && env.nodeEnv === 'production' ? 'Internal server error' : message,
    ...(details && { details }),
    ...(env.nodeEnv !== 'production' && status >= 500 && { stack: err.stack }),
  })
}
