const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const env = require('./config/env')
const routes = require('./routes')
const { notFound, errorHandler } = require('./middleware/error')

const app = express()

app.use(helmet())
app.use(cors({ origin: env.clientUrl.split(','), credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
if (env.nodeEnv !== 'test') app.use(morgan('dev'))
    
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'OmnyCRM Backend is running',
    status: 'OK'
  });
});

app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false }))
app.use('/api', routes)

app.use(notFound)
app.use(errorHandler)

module.exports = app
