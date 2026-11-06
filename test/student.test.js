import request from 'supertest'
import { describe, it, expect } from 'vitest'
import app from '../src/app.js'

// Constante pour faciliter les changements d'URL
const BASE = '/api/students'

// Modèle de base valide pour éviter de tout réécrire à chaque test
const validStudent = {
  name: 'Alice Martin',
  email: 'alice.martin@example.com',
  school: 'ESILV',
  year: '3'
}

describe('Students API', () => {
  it('GET should return an array', async () => {
    const res = await request(app).get(BASE)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('POST should create a student', async () => {
    const res = await request(app).post(BASE).send(validStudent)
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.name).toBe('Alice Martin')
  })

  it('POST should return 400 when required fields are missing', async () => {
    const res = await request(app).post(BASE).send({ name: 'Bob' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error', 'Missing required fields')
  })

  it('GET /:id should return the student', async () => {
    // 1. On crée un étudiant spécifiquement pour ce test
    const created = await request(app)
      .post(BASE)
      .send({ ...validStudent, email: 'carl@example.com' })
    // 2. On vient le chercher avec l'ID généré
    const res = await request(app).get(`${BASE}/${created.body.id}`)
    expect(res.status).toBe(200)
    expect(res.body.email).toBe('carl@example.com')
  })

  it('GET /:id should return 404 if not found', async () => {
    const res = await request(app).get(`${BASE}/9999`)
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error', 'Student not found')
  })

  it('PUT /:id should update the student', async () => {
    // 1. On crée un étudiant
    const created = await request(app)
      .post(BASE)
      .send({ ...validStudent, name: 'To Be Updated' })
    // 2. On modifie uniquement son année
    const res = await request(app)
      .put(`${BASE}/${created.body.id}`)
      .send({ year: '5' })
    expect(res.status).toBe(200)
    expect(res.body.year).toBe('5')
    expect(res.body.school).toBe(validStudent.school)
  })

  it('DELETE /:id should delete the student', async () => {
    // 1. On crée un étudiant
    const created = await request(app)
      .post(BASE)
      .send({ ...validStudent, email: 'delete.me@example.com' })
    // 2. On le supprime
    const deleteRes = await request(app).delete(`${BASE}/${created.body.id}`)
    expect(deleteRes.status).toBe(204)
    // 3. On vérifie qu'il a bien disparu
    const getRes = await request(app).get(`${BASE}/${created.body.id}`)
    expect(getRes.status).toBe(404)
  })
})
