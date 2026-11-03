const router = require('express').Router()
const ctrl = require('../controllers/grn.controller')
const { protect } = require('../middleware/auth')
const { authorize } = require('../middleware/role')
const { grnUploads } = require('../middleware/upload')
const { parseJsonFields, validate } = require('../middleware/validate')
const { createGrnSchema } = require('../validators/grn.validator')
const { ACCESS } = require('../utils/constants')

router.use(protect, authorize(...ACCESS.GRN))

router.get('/next-number', ctrl.nextNumber)
router.route('/')
  .get(ctrl.list)
  .post(grnUploads, parseJsonFields('items'), validate(createGrnSchema), ctrl.create)
router.route('/:id')
  .get(ctrl.getOne)
  .delete(ctrl.remove)

module.exports = router
