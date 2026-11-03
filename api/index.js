const app = require('../src/app')
const connectDB = require('../src/config/db')

let dbPromise

module.exports = async (req, res) => {
  try {
    if (!dbPromise) {
      dbPromise = connectDB().catch((error) => {
        dbPromise = null
        throw error
      })
    }

    await dbPromise
    return app(req, res)
  } catch (error) {
    console.error('Vercel API error:', error)
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
    })
  }
}
