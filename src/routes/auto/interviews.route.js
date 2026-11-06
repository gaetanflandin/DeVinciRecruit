import express from 'express'

const router = express.Router()

// Available rooms
const rooms = [
  { id: 1, name: 'Room A101', capacity: 4 },
  { id: 2, name: 'Room A102', capacity: 4 },
  { id: 3, name: 'Room B201', capacity: 6 }
]

// Interview slots
let interviews = [
  {
    id: 1,
    associationId: 1,
    roomId: 1,
    date: '2026-11-15',
    startTime: '10:00',
    endTime: '10:30',
    studentId: null,
    status: 'available'
  }
]

// Check whether two time slots overlap
function hasConflict (roomId, date, startTime, endTime, excludedId = null) {
  return interviews.some(interview =>
    interview.roomId === Number(roomId) &&
        interview.date === date &&
        interview.id !== excludedId &&
        interview.status !== 'cancelled' &&
        startTime < interview.endTime &&
        endTime > interview.startTime
  )
}

// GET all interviews
router.get('/', (req, res) => {
  res.status(200).json(interviews)
})

// GET available interview slots
router.get('/available', (req, res) => {
  const available = interviews.filter(
    interview => interview.status === 'available'
  )

  res.status(200).json(available)
})

// GET interview by ID
router.get('/:id', (req, res) => {
  const id = Number(req.params.id)

  const interview = interviews.find(i => i.id === id)

  if (!interview) {
    return res.status(404).json({
      error: 'Interview not found'
    })
  }

  res.json(interview)
})

// POST create a new interview slot
router.post('/', (req, res) => {
  const {
    associationId,
    roomId,
    date,
    startTime,
    endTime
  } = req.body

  if (!associationId || !roomId || !date ||
        !startTime || !endTime) {
    return res.status(400).json({
      error: 'Missing required fields'
    })
  }

  const room = rooms.find(r => r.id === Number(roomId))

  if (!room) {
    return res.status(404).json({
      error: 'Room not found'
    })
  }

  if (startTime >= endTime) {
    return res.status(400).json({
      error: 'Invalid interview time'
    })
  }

  if (hasConflict(roomId, date, startTime, endTime)) {
    return res.status(409).json({
      error: 'Room is already booked during this time'
    })
  }

  const newInterview = {
    id: interviews.length + 1,
    associationId,
    roomId: Number(roomId),
    date,
    startTime,
    endTime,
    studentId: null,
    status: 'available'
  }

  interviews.push(newInterview)

  res.status(201).json(newInterview)
})

// POST book an interview
router.post('/:id/book', (req, res) => {
  const id = Number(req.params.id)
  const { studentId } = req.body

  const interview = interviews.find(i => i.id === id)

  if (!interview) {
    return res.status(404).json({
      error: 'Interview not found'
    })
  }

  if (!studentId) {
    return res.status(400).json({
      error: 'Student ID is required'
    })
  }

  if (interview.status !== 'available') {
    return res.status(409).json({
      error: 'Interview slot is not available'
    })
  }

  interview.studentId = studentId
  interview.status = 'booked'

  res.status(200).json(interview)
})

// PUT update an interview
router.put('/:id', (req, res) => {
  const id = Number(req.params.id)

  const index = interviews.findIndex(i => i.id === id)

  if (index === -1) {
    return res.status(404).json({
      error: 'Interview not found'
    })
  }

  const updated = {
    ...interviews[index],
    ...req.body
  }

  if (hasConflict(
    updated.roomId,
    updated.date,
    updated.startTime,
    updated.endTime,
    id
  )) {
    return res.status(409).json({
      error: 'Room is already booked during this time'
    })
  }

  interviews[index] = updated

  res.status(200).json(updated)
})

// DELETE an interview
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id)

  const before = interviews.length

  interviews = interviews.filter(i => i.id !== id)

  if (interviews.length === before) {
    return res.status(404).json({
      error: 'Interview not found'
    })
  }

  res.status(204).end()
})

export default router
