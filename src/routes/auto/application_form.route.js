import express from 'express'
const router = express.Router()

const applications = []
let nextId = 1

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const REQUIRED_FIELDS = ['firstName', 'lastName', 'email', 'year', 'major', 'motivation']

const clean = (value) => String(value).trim()

// GET all applications
router.get('/', (req, res) => res.status(200).json(applications))

// GET one application
router.get('/:id', (req, res) => {
  const application = applications.find((a) => a.id === Number(req.params.id))
  if (!application) {
    return res.status(404).json({ error: 'Application not found' })
  }
  res.status(200).json(application)
})

// POST a new application
router.post('/', (req, res) => {
  const body = req.body ?? {}

  const missing = REQUIRED_FIELDS.filter(
    (field) => body[field] === undefined || body[field] === null || clean(body[field]) === ''
  )
  if (missing.length > 0) {
    return res.status(400).json({ error: 'Missing required fields', fields: missing })
  }

  const { firstName, lastName, email, year, major, motivation, position, availability } = body

  if (!EMAIL_REGEX.test(clean(email))) {
    return res.status(400).json({ error: 'Invalid email' })
  }
  if (!Number.isInteger(year) || year < 1 || year > 5) {
    return res.status(400).json({ error: 'Year must be an integer between 1 and 5' })
  }
  if (clean(motivation).length < 20) {
    return res.status(400).json({ error: 'Motivation must be at least 20 characters' })
  }

  const normalizedEmail = clean(email).toLowerCase()
  if (applications.some((a) => a.email === normalizedEmail)) {
    return res.status(409).json({ error: 'An application with this email already exists' })
  }

  const newApplication = {
    id: nextId++,
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
