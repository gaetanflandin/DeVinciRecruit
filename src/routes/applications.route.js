import express from 'express'
import { associations } from './associations.js'

const router = express.Router()

// Sample data for the lab; no database connection is needed.
const applications = []
let nextId = 1

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const REQUIRED_FIELDS = ['associationId', 'firstName', 'lastName', 'email', 'year', 'major', 'motivation']

const clean = (value) => String(value).trim()

// GET all applications (optional filter: /applications?associationId=1)
router.get('/applications', (req, res) => {
  const { associationId } = req.query
  if (associationId !== undefined) {
    return res
      .status(200)
      .json(applications.filter((a) => a.associationId === Number(associationId)))
  }
  res.status(200).json(applications)
})

// GET one application
router.get('/applications/:id', (req, res) => {
  const application = applications.find((a) => a.id === Number(req.params.id))
  if (!application) {
    return res.status(404).json({ error: 'Application not found' })
  }
  res.status(200).json(application)
})

// POST a new application (a student fills in an association's form)
router.post('/applications', (req, res) => {
  const body = req.body ?? {}

  const missing = REQUIRED_FIELDS.filter(
    (field) => body[field] === undefined || body[field] === null || clean(body[field]) === ''
  )
  if (missing.length > 0) {
    return res.status(400).json({ error: 'Missing required fields', fields: missing })
  }

  const { firstName, lastName, email, major, motivation, position, availability } = body

  // The association must exist (same ids as GET /api/associations)
  const associationId = Number(body.associationId)
  const association = associations.find((a) => a.id === associationId)
  if (!association) {
    return res.status(404).json({ error: 'Association not found' })
  }

  if (!EMAIL_REGEX.test(clean(email))) {
    return res.status(400).json({ error: 'Invalid email' })
  }

  // Accepts 4 or "4" (the students route stores year as a string)
  const year = Number(body.year)
  if (!Number.isInteger(year) || year < 1 || year > 5) {
    return res.status(400).json({ error: 'Year must be an integer between 1 and 5' })
  }

  if (clean(motivation).length < 20) {
    return res.status(400).json({ error: 'Motivation must be at least 20 characters' })
  }

  // One application per email per association (a student can apply to several associations)
  const normalizedEmail = clean(email).toLowerCase()
  if (applications.some((a) => a.email === normalizedEmail && a.associationId === associationId)) {
    return res
      .status(409)
      .json({ error: 'An application with this email already exists for this association' })
  }

  const newApplication = {
    id: nextId++,
    associationId,
    associationName: association.name,
    firstName: clean(firstName),
    lastName: clean(lastName),
    email: normalizedEmail,
    year,
    major: clean(major),
    motivation: clean(motivation),
    position: position ? clean(position) : null,
    availability: availability ? clean(availability) : null,
    status: 'pending',
    createdAt: new Date().toISOString()
  }

  applications.push(newApplication)
  res.status(201).json(newApplication)
})

export default router