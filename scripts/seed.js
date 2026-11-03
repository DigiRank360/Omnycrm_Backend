const env = require('../src/config/env')
const connectDB = require('../src/config/db')
const User = require('../src/models/User')
const { ROLES } = require('../src/utils/constants')

const accounts = [
  { ...env.admin, role: ROLES.ADMIN },
  { ...env.qc, role: ROLES.QC },
]

;(async () => {
  await connectDB()
  for (const acc of accounts) {
    if (await User.exists({ email: acc.email })) {
      console.log(`Already exists: ${acc.email} (${acc.role})`)
    } else {
      await User.create(acc)
      console.log(`Created: ${acc.email} (${acc.role})`)
    }
  }
  process.exit(0)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
