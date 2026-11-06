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
import interviewsRouter from "./routes/auto/interviews.route.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(express.json())

// Parse incoming JSON request bodies
app.use(express.json())

// Simple root + health endpoints
app.get('/', (_req, res) => res.json({ ok: true, message: 'Hello from CI/CD demo 👋' }))
app.get('/health', (_req, res) => res.status(200).send('OK'))

// Auto-mount all routers placed under src/routes/auto
// (import() instead of require() so that Vitest can measure their coverage)
const autoDir = path.join(__dirname, 'routes', 'auto')
if (fs.existsSync(autoDir)) {
  const files = fs.readdirSync(autoDir).filter(f => f.endsWith('.route.js'))
  for (const f of files) {
    // Import ES modules so the test runner can measure route coverage.
    const mod = await import(new URL(`./routes/auto/${f}`, import.meta.url).href)
    const router = mod.default || mod
    if (router) app.use('/', router)
  }
}

// Global error middleware last
app.use('/api/students', studentrouter)
app.use("/api/interviews", interviewsRouter)
app.use(errorHandler)
export default app
