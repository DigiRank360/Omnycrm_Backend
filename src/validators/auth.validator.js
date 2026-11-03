const { z } = require('zod')

exports.loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
  role: z.enum(['admin', 'qc']).optional(),
})
