/**
 * Applications API: a student applies to an association.
 * GET /api/applications, GET /api/applications/:id, POST, PUT /:id, DELETE /:id
 */
import express from 'express'
import { associations } from './associations.route.js'

const router = express.Router()

// Sample data for the lab; no database connection is needed.
let applications = []
let nextId = 1

const BASE = '/api/applications'
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const REQUIRED_FIELDS = ['associationId', 'firstName', 'lastName', 'email', 'year', 'major', 'motivation']
const STATUSES = ['pending', 'interview', 'accepted', 'rejected']

const clean = (value) => String(value).trim()
const isEmpty = (value) => value === undefined || value === null || clean(value) === ''

// Returns an error message, or null if the field is valid
const validateEmail = (email) => (EMAIL_REGEX.test(clean(email)) ? null : 'Invalid email')
const validateYear = (year) =>
  Number.isInteger(year) && year >= 1 && year <= 5 ? null : 'Year must be an integer between 1 and 5'
const validateMotivation = (motivation) =>
  clean(motivation).length >= 20 ? null : 'Motivation must be at least 20 characters'

const findAssociation = (id) => associations.find((a) => a.id === Number(id))

const isDuplicate = (email, associationId, ignoreId = null) =>
  applications.some(
    (a) => a.email === email && a.associationId === associationId && a.id !== ignoreId
  )

// GET all applications (optional filter: ?associationId=1)
router.get(BASE, (req, res) => {
  const { associationId } = req.query
  if (associationId !== undefined) {
    return res
      .status(200)
      .json(applications.filter((a) => a.associationId === Number(associationId)))
  }
  res.status(200).json(applications)
})

// GET one application
router.get(`${BASE}/:id`, (req, res) => {
  const application = applications.find((a) => a.id === Number(req.params.id))
  if (!application) {
    return res.status(404).json({ error: 'Application not found' })
  }
  res.status(200).json(application)
})

// POST a new application (a student fills in an association's form)
router.post(BASE, (req, res) => {
  const body = req.body ?? {}

  const missing = REQUIRED_FIELDS.filter((field) => isEmpty(body[field]))
  if (missing.length > 0) {
    return res.status(400).json({ error: 'Missing required fields', fields: missing })
  }

  const association = findAssociation(body.associationId)
  if (!association) {
    return res.status(404).json({ error: 'Association not found' })
  }

  // Accepts 4 or "4" (the students route stores year as a string)
  const year = Number(body.year)
  const error =
    validateEmail(body.email) || validateYear(year) || validateMotivation(body.motivation)
  if (error) {
    return res.status(400).json({ error })
  }

  const email = clean(body.email).toLowerCase()
  if (isDuplicate(email, association.id)) {
    return res
      .status(409)
      .json({ error: 'An application with this email already exists for this association' })
  }

  const newApplication = {
    id: nextId++,
    associationId: association.id,
    associationName: association.name,
    firstName: clean(body.firstName),
    lastName: clean(body.lastName),
    email,
    year,
    major: clean(body.major),
    motivation: clean(body.motivation),
    position: body.position ? clean(body.position) : null,
    availability: body.availability ? clean(body.availability) : null,
    status: 'pending',
    createdAt: new Date().toISOString()
  }

  applications.push(newApplication)
  res.status(201).json(newApplication)
})

// PUT update an application (e.g. the association changes its status)
router.put(`${BASE}/:id`, (req, res) => {
  const index = applications.findIndex((a) => a.id === Number(req.params.id))
  if (index === -1) {
    return res.status(404).json({ error: 'Application not found' })
  }

  const body = req.body ?? {}
  const current = applications[index]
  const updated = { ...current }

  // Text fields that can be updated
  for (const field of ['firstName', 'lastName', 'major', 'position', 'availability']) {
    if (body[field] !== undefined) {
      if (isEmpty(body[field])) {
        return res.status(400).json({ error: `${field} cannot be empty` })
      }
      updated[field] = clean(body[field])
    }
  }

  if (body.email !== undefined) {
    const error = validateEmail(body.email)
    if (error) return res.status(400).json({ error })
    updated.email = clean(body.email).toLowerCase()
  }

  if (body.year !== undefined) {
    const year = Number(body.year)
    const error = validateYear(year)
    if (error) return res.status(400).json({ error })
    updated.year = year
  }

  if (body.motivation !== undefined) {
    const error = validateMotivation(body.motivation)
    if (error) return res.status(400).json({ error })
    updated.motivation = clean(body.motivation)
  }

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) {
      return res.status(400).json({ error: `Status must be one of: ${STATUSES.join(', ')}` })
    }
    updated.status = body.status
  }

  if (isDuplicate(updated.email, updated.associationId, current.id)) {
    return res
      .status(409)
      .json({ error: 'An application with this email already exists for this association' })
  }

  // id, associationId and createdAt never change
  updated.updatedAt = new Date().toISOString()
  applications[index] = updated
  res.status(200).json(updated)
})

// DELETE an application
router.delete(`${BASE}/:id`, (req, res) => {
  const id = Number(req.params.id)
  const before = applications.length
  applications = applications.filter((a) => a.id !== id)
  if (applications.length === before) {
    return res.status(404).json({ error: 'Application not found' })
  }
  res.status(204).end()
})

export default router
