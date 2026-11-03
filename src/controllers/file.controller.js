const path = require('path')
const fs = require('fs')
const { UPLOAD_DIR } = require('../middleware/upload')
const ApiError = require('../utils/ApiError')

exports.getFile = (req, res) => {
  const name = path.basename(req.params.name)
  const full = path.join(UPLOAD_DIR, name)
  if (!fs.existsSync(full)) throw ApiError.notFound('File not found')
  res.sendFile(full)
}
