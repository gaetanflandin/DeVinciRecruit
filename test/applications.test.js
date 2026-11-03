import request from 'supertest'
import { describe, it, expect } from 'vitest'
import app from '../src/app.js'

// Mets ici le vrai chemin de ta route (il depend du nom du fichier)
const BASE = '/applications'

const validApplication = {
  firstName: 'Alice',
  lastName: 'Martin',
  email: 'alice.martin@example.com',
  year: 3,
  major: 'Data & IA',
  motivation: 'Je veux rejoindre cette association pour participer a de vrais projets.',
  position: 'Developpement'
}

describe('Applications API', () => {
  it('GET should return an array', async () => {
    const res = await request(app).get(BASE)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('POST should create an application', async () => {
    const res = await request(app).post(BASE).send(validApplication)
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.status).toBe('pending')
  })

  it('POST should return 400 when required fields are missing', async () => {
    const res = await request(app).post(BASE).send({ firstName: 'Bob' })
    expect(res.status).toBe(400)
    expect(res.body.fields).toContain('email')
  })

  it('POST should return 400 for an invalid email', async () => {
    const res = await request(app)
      .post(BASE)
      .send({ ...validApplication, email: 'not-an-email' })
    expect(res.status).toBe(400)
  })

  it('POST should return 400 for an invalid year', async () => {
    const res = await request(app)
      .post(BASE)
      .send({ ...validApplication, email: 'year@example.com', year: 9 })
    expect(res.status).toBe(400)
  })

  it('POST should return 400 when the motivation is too short', async () => {
    const res = await request(app)
      .post(BASE)
      .send({ ...validApplication, email: 'short@example.com', motivation: 'Trop court' })
    expect(res.status).toBe(400)
  })

  it('POST should return 409 for a duplicate email', async () => {
    const res = await request(app)
      .post(BASE)
      .send({ ...validApplication, email: 'ALICE.MARTIN@example.com' })
    expect(res.status).toBe(409)
  })

  it('GET /:id should return the application', async () => {
    const created = await request(app)
      .post(BASE)
      .send({ ...validApplication, email: 'carl@example.com' })
    const res = await request(app).get(`${BASE}/${created.body.id}`)
    expect(res.status).toBe(200)
    expect(res.body.email).toBe('carl@example.com')
  })

  it('GET /:id should return 404 if not found', async () => {
    const res = await request(app).get(`${BASE}/9999`)
    expect(res.status).toBe(404)
  })
})
