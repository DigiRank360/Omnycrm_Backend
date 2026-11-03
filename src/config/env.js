const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/omnyx_crm',
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  admin: {
    name: process.env.ADMIN_NAME || 'Admin',
    email: process.env.ADMIN_EMAIL || 'admin@omnyx.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
  qc: {
    name: process.env.QC_NAME || 'QC Team',
    email: process.env.QC_EMAIL || 'qc@omnyx.com',
    password: process.env.QC_PASSWORD || 'qc12345',
  },
}

if (env.nodeEnv === 'production' && env.jwtSecret === 'change-me-in-production') {
  throw new Error('JWT_SECRET must be set in production')
}

module.exports = env
