import { Router } from 'express'
import { hasApplicationsForForm } from './applications_form.route.js'

const router = Router()
const forms = []
let nextId = 1
const fieldTypes = ['text', 'textarea', 'email', 'number', 'date', 'select', 'checkbox']
const positiveId = value => Number.isSafeInteger(value) && value > 0
const nonempty = value => typeof value === 'string' && value.trim().length > 0
const fail = (status, message) => Object.assign(new Error(message), { status })

function validDate (value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/.test(value)) return false
  const date = new Date(value)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value.slice(0, 10)
}

function formFrom (body) {
  if (!body || !positiveId(body.associationId) || !nonempty(body.title) ||
      (body.templateId !== undefined && !positiveId(body.templateId))) {
    throw fail(400, 'associationId and optional templateId must be positive integer IDs; title is required')
  }
  if (!validDate(body.openDate) || !validDate(body.closeDate) || new Date(body.openDate) >= new Date(body.closeDate)) {
    throw fail(400, 'Use valid ISO dates with openDate before closeDate')
  }
  if (!Array.isArray(body.fields) || body.fields.length === 0) {
    throw fail(400, 'fields must be a non-empty array')
  }
  const names = new Set()
  const fields = body.fields.map(field => {
    if (!field || !nonempty(field.name) || !fieldTypes.includes(field.type) ||
        (field.label !== undefined && !nonempty(field.label)) ||
        (field.required !== undefined && typeof field.required !== 'boolean')) {
      throw fail(400, 'Each field requires a name and supported type; label and required must be valid when supplied')
    }
    const name = field.name.trim()
    if (names.has(name)) throw fail(400, 'Field names must be unique')
    names.add(name)
    if ((field.type === 'select' || field.options !== undefined) &&
        (!Array.isArray(field.options) || field.options.length === 0 || !field.options.every(nonempty))) {
      throw fail(400, 'Select fields require non-empty string options')
    }
    return {
      name,
      type: field.type,
      ...(field.label !== undefined ? { label: field.label.trim() } : {}),
      ...(field.required !== undefined ? { required: field.required } : {}),
      ...(field.options !== undefined ? { options: field.options.map(option => option.trim()) } : {})
    }
  })
  return {
    associationId: body.associationId,
    ...(body.templateId !== undefined ? { templateId: body.templateId } : {}),
    title: body.title.trim(),
    fields,
    openDate: body.openDate,
    closeDate: body.closeDate
  }
}

router.param('id', (req, res, next, value) => {
  const form = /^[1-9]\d*$/.test(value) && positiveId(Number(value))
    ? forms.find(form => form.id === Number(value))
    : undefined
  if (!form) return next(fail(404, 'Application form not found'))
  res.locals.form = form
  next()
})

router.get('/api/forms', (_req, res) => res.status(200).json(forms))
router.get('/api/forms/:id', (_req, res) => res.status(200).json(res.locals.form))

router.post('/api/forms', (req, res) => {
  const profile = formFrom(req.body)
  const form = { id: nextId++, ...profile }
  forms.push(form)
  res.location(`/api/forms/${form.id}`).status(201).json(form)
})

router.put('/api/forms/:id', (req, res) => {
  const profile = formFrom(req.body)
  const form = res.locals.form
  if (profile.associationId !== form.associationId && hasApplicationsForForm(form.id)) {
    throw fail(409, 'Cannot reassign a form referenced by student applications')
  }
  const updated = { id: form.id, ...profile }
  forms[forms.indexOf(form)] = updated
  res.status(200).json(updated)
})

router.delete('/api/forms/:id', (_req, res) => {
  const form = res.locals.form
  if (hasApplicationsForForm(form.id)) {
    throw fail(409, 'Cannot delete a form referenced by student applications')
  }
  forms.splice(forms.indexOf(form), 1)
  res.status(204).end()
})

export default router
