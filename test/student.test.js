import request from 'supertest'
import app from '../src/app.js'
import { describe, it, expect } from 'vitest'

describe('Students API', () => {
  it('GET /api/students should return an array', async () => {
    const res = await request(app).get('/api/students')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('POST /api/students should add a new student', async () => {
    const res = await request(app)
      .post('/api/students')
      .send({ name: 'John Doe', email: 'john.doe@example.com', school: 'ESILV', year: '4' })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
  })
})
