const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const multer = require('multer')
const ApiError = require('../utils/ApiError')

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 15 },
  fileFilter: (_req, file, cb) =>
    ALLOWED.includes(file.mimetype) ? cb(null, true) : cb(ApiError.badRequest('Only PDF, JPG, PNG or WEBP files are allowed')),
})

exports.UPLOAD_DIR = UPLOAD_DIR
exports.grnUploads = upload.fields([
  { name: 'invoice', maxCount: 1 },
  { name: 'packagingPhotos', maxCount: 10 },
  { name: 'courierReceipt', maxCount: 1 },
])
