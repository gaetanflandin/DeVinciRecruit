import request from 'supertest'
import app from '../src/app.js'
import { describe, it, expect } from 'vitest'

describe('GET /api/associations', () => {
  it('returns HTTP 200 and a JSON array', async () => {
    const res = await request(app).get('/api/associations')

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/application\/json/)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
  })

  it('returns association profiles with all required fields', async () => {
    const res = await request(app).get('/api/associations')

    for (const association of res.body) {
      expect(association).toEqual({
        id: expect.any(Number),
        name: expect.any(String),
        description: expect.any(String),
        category: expect.any(String),
        logoUrl: expect.any(String)
      })
      for (const field of ['name', 'description', 'category', 'logoUrl']) {
        expect(association[field].length).toBeGreaterThan(0)
      }
    }
    expect(res.body.some(association => association.name === 'Vinci Racing Team')).toBe(true)
    expect(new Set(res.body.map(association => association.id)).size).toBe(res.body.length)
  })
})
