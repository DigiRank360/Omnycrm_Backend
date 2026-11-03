const { z } = require('zod')
const { ROLES } = require('../utils/constants')

exports.createUserSchema = z.object({
  name: z.string().trim().min(1, 'Name required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(Object.values(ROLES)),
})

exports.updateUserSchema = z.object({
  name: z.string().trim().min(1).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(Object.values(ROLES)).optional(),
  isActive: z.boolean().optional(),
})
