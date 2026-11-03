const router = require('express').Router()

router.get('/health', (_req, res) => res.json({ success: true, status: 'ok', time: new Date().toISOString() }))
router.use('/auth', require('./auth.routes'))
router.use('/grns', require('./grn.routes'))
router.use('/qc', require('./qc.routes'))
router.use('/users', require('./user.routes'))
router.use('/', require('./misc.routes'))

module.exports = router
