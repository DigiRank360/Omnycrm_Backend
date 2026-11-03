const router = require('express').Router()
const ctrl = require('../controllers/user.controller')
const { protect } = require('../middleware/auth')
const { authorize } = require('../middleware/role')
const { validate } = require('../middleware/validate')
const { createUserSchema, updateUserSchema } = require('../validators/user.validator')
const { ACCESS } = require('../utils/constants')

router.use(protect, authorize(...ACCESS.USERS))

router.route('/').get(ctrl.list).post(validate(createUserSchema), ctrl.create)
router.patch('/:id', validate(updateUserSchema), ctrl.update)

module.exports = router
