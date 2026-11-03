const router = require('express').Router()
const ctrl = require('../controllers/qc.controller')
const { protect } = require('../middleware/auth')
const { authorize } = require('../middleware/role')
const { validate } = require('../middleware/validate')
const { createQcSchema, submitQcSchema } = require('../validators/qc.validator')
const { ACCESS } = require('../utils/constants')

router.use(protect, authorize(...ACCESS.QC))

router.get('/checklist', ctrl.checklist)
router.route('/')
  .get(ctrl.list)
  .post(validate(createQcSchema), ctrl.create)
router.get('/:id', ctrl.getOne)
router.put('/:id/submit', validate(submitQcSchema), ctrl.submit)

module.exports = router
