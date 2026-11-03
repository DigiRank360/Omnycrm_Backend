const env = require('./src/config/env')
const connectDB = require('./src/config/db')
const app = require('./src/app')

connectDB()
  .then(() => app.listen(env.port, () => console.log(`API running on http://localhost:${env.port}`)))
  .catch((err) => {
    console.error('Failed to start server:', err.message)
    process.exit(1)
  })
