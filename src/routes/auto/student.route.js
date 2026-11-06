import express from 'express'
const router = express.Router()

let students = [
  { id: 1, name: 'John Doe', email: 'john.doe@example.com', school: 'ESILV', year: '4' },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', school: 'EMLV', year: '3' }
]

// GET all students
router.get('/', (req, res) => res.status(200).json(students))

// GET by ID
router.get('/:id', (req, res) => {
  const id = Number(req.params.id)
  const student = students.find(s => s.id === id)
  if (!student) return res.status(404).json({ error: 'Student not found' })
  res.json(student)
})

// POST a new student
router.post('/', (req, res) => {
  const { name, email, school, year } = req.body
  const requiredFields = ['name', 'email', 'school', 'year']
  const hasAllFields = requiredFields.every(field => req.body[field])
  if (!hasAllFields) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  const newStudent = { id: students.length + 1, name, email, school, year }
  students.push(newStudent)
  res.status(201).json(newStudent)
})

// PUT
router.put('/:id', (req, res) => {
  const id = Number(req.params.id)
  const index = students.findIndex(s => s.id === id)
  if (index === -1) {
    return res.status(404).json({ error: 'Student not found' })
  }
  students[index] = { ...students[index], ...req.body }
  res.json(students[index])
})

// DELETE
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id)
  const before = students.length
  students = students.filter(s => s.id !== id)
  if (students.length === before) {
    return res.status(404).json({ error: 'Student not found' })
  }
  res.status(204).end()
})

export default router
