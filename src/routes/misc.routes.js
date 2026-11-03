const router = require('express').Router()
const { stats } = require('../controllers/dashboard.controller')
const { options } = require('../controllers/meta.controller')
const { getFile } = require('../controllers/file.controller')
const { protect } = require('../middleware/auth')
const { authorize } = require('../middleware/role')
const { ACCESS } = require('../utils/constants')

router.use(protect)

router.get('/dashboard/stats', authorize(...ACCESS.DASHBOARD), stats)
router.get('/meta/options', authorize(...ACCESS.QC), options)
// Invoices & packaging photos belong to the GRN module
router.get('/files/:name', authorize(...ACCESS.GRN), getFile)

module.exports = router
