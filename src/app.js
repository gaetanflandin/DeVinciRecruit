/**
 * Express app configuration.
 * Responsibilities:
 *  - Base routes (/, /health)
 *  - Auto-mount all routers in src/routes/auto/*.route.js
 *  - Global error handler (consistent JSON for errors)
 */
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { errorHandler } from './utils/errorHandler.js'
import studentrouter from './routes/auto/student.route.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use(express.json())

// Simple root + health endpoints
app.get('/', (_req, res) => res.json({ ok: true, message: 'Hello from CI/CD demo 👋' }))
app.get('/health', (_req, res) => res.status(200).send('OK'))

// Auto-mount all routers placed under src/routes/auto
const autoDir = path.join(__dirname, 'routes', 'auto')
if (fs.existsSync(autoDir)) {
  const files = fs.readdirSync(autoDir).filter(f => f.endsWith('.route.js'))
  for (const f of files) {
    if (f === 'student.route.js') continue
    const mod = await import(new URL(`./routes/auto/${f}`, import.meta.url).href)
    const router = mod.default || mod
    if (router) app.use('/', router)
  }
}

app.use('/api/students', studentrouter)
// Global error middleware last
app.use(errorHandler)
export default app
