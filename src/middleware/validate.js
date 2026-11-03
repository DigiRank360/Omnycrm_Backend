const ApiError = require('../utils/ApiError')

// Parses JSON-encoded multipart fields (e.g. items) before validation
exports.parseJsonFields = (...fields) => (req, _res, next) => {
  for (const f of fields) {
    if (typeof req.body[f] === 'string') {
      try {
        req.body[f] = JSON.parse(req.body[f])
      } catch {
        throw ApiError.badRequest(`Field "${f}" must be valid JSON`)
      }
    }
  }
  next()
}

exports.validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
    throw ApiError.badRequest('Validation failed', details)
  }
  req.body = result.data
  next()
}
