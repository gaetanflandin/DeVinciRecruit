import request from 'supertest'
import { describe, it, expect } from 'vitest'
import app from '../src/app.js'

const BASE = '/api/applications'

const validApplication = {
  associationId: 1,
  firstName: 'Alice',
  lastName: 'Martin',
  email: 'alice.martin@example.com',
  year: 3,
  major: 'Data & IA',
  motivation: 'Je veux rejoindre cette association pour participer a de vrais projets.',
  position: 'Developpement'
}

// Creates an application with a unique email and returns the response
const createApplication = (overrides = {}) =>
  request(app)
    .post(BASE)
    .send({ ...validApplication, email: `user${Date.now()}${Math.random()}@example.com`, ...overrides })

describe('Applications API - GET', () => {
  it('GET should return an array', async () => {
    const res = await request(app).get(BASE)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('GET ?associationId should only return applications of that association', async () => {
    await createApplication({ associationId: 2 })
    const res = await request(app).get(`${BASE}?associationId=2`)
    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThan(0)
    expect(res.body.every((a) => a.associationId === 2)).toBe(true)
  })

  it('GET /:id should return the application', async () => {
    const created = await createApplication({ email: 'carl@example.com' })
    const res = await request(app).get(`${BASE}/${created.body.id}`)
    expect(res.status).toBe(200)
    expect(res.body.email).toBe('carl@example.com')
  })

  it('GET /:id should return 404 if not found', async () => {
    const res = await request(app).get(`${BASE}/9999`)
    expect(res.status).toBe(404)
  })
})

describe('Applications API - POST', () => {
  it('POST should create an application', async () => {
    const res = await request(app).post(BASE).send(validApplication)
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.status).toBe('pending')
    expect(res.body.associationName).toBe('Vinci Racing Team')
    expect(res.body.availability).toBeNull()
  })

  it('POST should accept the year as a string', async () => {
    const res = await createApplication({ year: '4', availability: 'Mardi soir' })
    expect(res.status).toBe(201)
    expect(res.body.year).toBe(4)
    expect(res.body.availability).toBe('Mardi soir')
  })

  it('POST should return 400 when required fields are missing', async () => {
    const res = await request(app).post(BASE).send({ firstName: 'Bob' })
    expect(res.status).toBe(400)
    expect(res.body.fields).toContain('email')
    expect(res.body.fields).toContain('associationId')
  })

  it('POST should return 400 when the body is empty', async () => {
    const res = await request(app).post(BASE)
    expect(res.status).toBe(400)
  })

  it('POST should return 404 for an unknown association', async () => {
    const res = await createApplication({ associationId: 999 })
    expect(res.status).toBe(404)
  })

  it('POST should return 400 for an invalid email', async () => {
    const res = await createApplication({ email: 'not-an-email' })
    expect(res.status).toBe(400)
  })

  it('POST should return 400 for an invalid year', async () => {
    const res = await createApplication({ year: 9 })
    expect(res.status).toBe(400)
  })

  it('POST should return 400 when the motivation is too short', async () => {
    const res = await createApplication({ motivation: 'Trop court' })
    expect(res.status).toBe(400)
  })

  it('POST should return 409 for a duplicate email in the same association', async () => {
    const res = await request(app)
      .post(BASE)
      .send({ ...validApplication, email: 'ALICE.MARTIN@example.com' })
    expect(res.status).toBe(409)
  })

  it('POST should allow the same email for another association', async () => {
    const res = await request(app)
      .post(BASE)
      .send({ ...validApplication, associationId: 2 })
    expect(res.status).toBe(201)
  })
})

describe('Applications API - PUT', () => {
  it('PUT should update the status and fields', async () => {
    const created = await createApplication()
    const res = await request(app)
      .put(`${BASE}/${created.body.id}`)
      .send({
        status: 'accepted',
        firstName: 'Alicia',
        email: `new${Date.now()}@example.com`,
        year: '5',
        motivation: 'Nouvelle motivation suffisamment longue pour passer.'
      })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('accepted')
    expect(res.body.firstName).toBe('Alicia')
    expect(res.body.year).toBe(5)
    expect(res.body).toHaveProperty('updatedAt')
    expect(res.body.id).toBe(created.body.id)
  })

  it('PUT should return 404 if not found', async () => {
    const res = await request(app).put(`${BASE}/9999`).send({ status: 'accepted' })
    expect(res.status).toBe(404)
  })

  it('PUT should return 400 for an invalid status', async () => {
    const created = await createApplication()
    const res = await request(app).put(`${BASE}/${created.body.id}`).send({ status: 'maybe' })
    expect(res.status).toBe(400)
  })

  it('PUT should return 400 for an empty text field', async () => {
    const created = await createApplication()
    const res = await request(app).put(`${BASE}/${created.body.id}`).send({ lastName: '  ' })
    expect(res.status).toBe(400)
  })

  it('PUT should return 400 for an invalid email', async () => {
    const created = await createApplication()
    const res = await request(app).put(`${BASE}/${created.body.id}`).send({ email: 'bad' })
    expect(res.status).toBe(400)
  })

  it('PUT should return 400 for an invalid year', async () => {
    const created = await createApplication()
    const res = await request(app).put(`${BASE}/${created.body.id}`).send({ year: 0 })
    expect(res.status).toBe(400)
  })

  it('PUT should return 400 when the motivation is too short', async () => {
    const created = await createApplication()
    const res = await request(app).put(`${BASE}/${created.body.id}`).send({ motivation: 'Court' })
    expect(res.status).toBe(400)
  })

  it('PUT should return 409 when the new email is already used in the association', async () => {
    const first = await createApplication({ email: 'taken@example.com' })
    const second = await createApplication()
    expect(first.status).toBe(201)
    const res = await request(app)
      .put(`${BASE}/${second.body.id}`)
      .send({ email: 'taken@example.com' })
    expect(res.status).toBe(409)
  })
})

describe('Applications API - DELETE', () => {
  it('DELETE should remove the application', async () => {
    const created = await createApplication()
    const res = await request(app).delete(`${BASE}/${created.body.id}`)
    expect(res.status).toBe(204)

    const check = await request(app).get(`${BASE}/${created.body.id}`)
    expect(check.status).toBe(404)
  })

  it('DELETE should return 404 if not found', async () => {
    const res = await request(app).delete(`${BASE}/9999`)
    expect(res.status).toBe(404)
  })
})
