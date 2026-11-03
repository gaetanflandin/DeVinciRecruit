import express from 'express'
const router = express.Router()

const students = [
  { id: 1, name: 'John Doe', email: 'john.doe@example.com', school: 'ESILV', year: '4' },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', school: 'EMLV', year: '3' }
]
// GET all students
router.get('/', (req, res) => res.status(200).json(students))

// POST a new student
router.post('/', (req, res) => {
  const { name, email, school, year } = req.body
  if (!name || !email || !school || !year) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  const newStudent = { id: students.length + 1, name, email, school, year }
  students.push(newStudent)
  res.status(201).json(newStudent)
})
export default router
