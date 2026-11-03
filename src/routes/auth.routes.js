const router = require('express').Router()
const { login, me } = require('../controllers/auth.controller')
const { protect } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { loginSchema } = require('../validators/auth.validator')

router.post('/login', validate(loginSchema), login)
router.get('/me', protect, me)

module.exports = router
