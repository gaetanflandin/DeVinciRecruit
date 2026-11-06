/**
 * In-memory association profile CRUD API.
 */
import { Router } from 'express'

const router = Router()

// Sample data for the lab; no database connection is needed.
const associations = [
  {
    id: 1,
    name: 'Vinci Racing Team',
    description: 'A student team bringing together motorsport and engineering enthusiasts.',
    category: 'Engineering',
    logoUrl: 'https://example.com/logos/vinci-racing-team.png'
  },
  {
    id: 2,
    name: 'De Vinci Coding Club (sample)',
    description: 'A sample association for students interested in programming and software projects.',
    category: 'Technology',
    logoUrl: 'https://example.com/logos/coding-club.png'
  }
]

// Monotonic IDs avoid collisions and reuse after deletions.
let nextId = 3
const fields = ['name', 'description', 'category', 'logoUrl']

function httpError (status, message) {
  return Object.assign(new Error(message), { status })
}

function profileFrom (body) {
  if (!body || fields.some(field => typeof body[field] !== 'string' || !body[field].trim())) {
    throw httpError(400, 'name, description, category and logoUrl must be non-empty strings')
  }
  return Object.fromEntries(fields.map(field => [field, body[field].trim()]))
}

// Resolve a complete numeric ID without accepting partial matches such as "1abc".
router.param('id', (req, res, next, value) => {
  const id = Number(value)
  const association = /^[1-9]\d*$/.test(value) && Number.isSafeInteger(id)
    ? associations.find(association => association.id === id)
    : undefined
  if (!association) return next(httpError(404, 'Association not found'))
  res.locals.association = association
  next()
})

router.get('/api/associations', (_req, res) => {
  res.status(200).json(associations)
})

router.get('/api/associations/:id', (_req, res) => {
  res.status(200).json(res.locals.association)
})

router.post('/api/associations', (req, res) => {
  const profile = profileFrom(req.body)
  const association = { id: nextId++, ...profile }
  associations.push(association)
  res.location(`/api/associations/${association.id}`).status(201).json(association)
})

router.put('/api/associations/:id', (req, res) => {
  const profile = profileFrom(req.body)
  Object.assign(res.locals.association, profile)
  res.status(200).json(res.locals.association)
})

router.delete('/api/associations/:id', (_req, res) => {
  associations.splice(associations.indexOf(res.locals.association), 1)
  res.status(204).end()
})

export default router
