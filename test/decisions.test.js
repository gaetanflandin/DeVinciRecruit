import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

let app
let application
const president = { 'X-Demo-Role': 'president', 'X-Demo-User-Id': 'president-1' }
const endpoint = id => `/api/applications/${id}/decision`

beforeEach(async () => {
  vi.resetModules()
  app = (await import('../src/app.js')).default
  const res = await request(app).post('/applications').send({
    firstName: 'Alice',
    lastName: 'Martin',
    email: 'decision@example.com',
    year: 3,
    major: 'Engineering',
    motivation: 'I would like to contribute to student association projects.'
  })
  expect(res.status).toBe(201)
  application = res.body
})

describe('Recruitment decisions', () => {
  it.each(['accepted', 'rejected'])('records a final %s decision in the existing application', async decision => {
    const before = Date.now()
    const res = await request(app).patch(endpoint(application.id)).set(president)
      .send({ decision, decidedBy: 'spoofed', decidedAt: 'spoofed', notes: 'Private evaluation' })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      id: application.id,
      status: decision,
      decidedBy: 'president-1',
      decidedAt: expect.any(String)
    })
    expect(Date.parse(res.body.decidedAt)).toBeGreaterThanOrEqual(before)
    expect(Date.parse(res.body.decidedAt)).toBeLessThanOrEqual(Date.now())
    const stored = (await request(app).get(`/applications/${application.id}`)).body
    expect(stored).toEqual({ ...application, ...res.body })
    const list = (await request(app).get('/applications')).body
    expect(list).toContainEqual(stored)
    expect(JSON.stringify(list)).not.toContain('Private evaluation')
    expect(res.body).not.toHaveProperty('notes')
  })

  it('keeps pending decisions without final decision metadata', async () => {
    const res = await request(app).patch(endpoint(application.id)).set(president).send({ decision: 'pending' })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ id: application.id, status: 'pending', decidedBy: null, decidedAt: null })
  })

  it('clears final metadata when returning to pending', async () => {
    await request(app).patch(endpoint(application.id)).set(president).send({ decision: 'accepted' })
    const res = await request(app).patch(endpoint(application.id)).set(president).send({ decision: 'pending' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ status: 'pending', decidedBy: null, decidedAt: null })
    expect((await request(app).get(`/applications/${application.id}`)).body).toMatchObject(res.body)
  })

  it.each([{}, { decision: 'accept' }, { decision: 'Accepted' }, { decision: '' },
    { decision: null }, { decision: 1 }, { decision: [] }, { decision: {} }, { status: 'accepted' }])(
    'rejects invalid body %j without changing the application', async body => {
      const res = await request(app).patch(endpoint(application.id)).set(president).send(body)
      expect(res.status).toBe(400)
      expect(res.body).toMatchObject({ error: true, message: expect.any(String) })
      expect((await request(app).get(`/applications/${application.id}`)).body).toEqual(application)
    }
  )

  it('rejects an absent body', async () => {
    const res = await request(app).patch(endpoint(application.id)).set(president)
    expect(res.status).toBe(400)
  })

  it.each(['9999', '1abc', '1.5', '-1', '9007199254740992'])(
    'returns 404 for missing or malformed application ID %s', async id => {
      const res = await request(app).patch(endpoint(id)).set(president).send({ decision: 'accepted' })
      expect(res.status).toBe(404)
      expect(res.body).toEqual({ error: true, message: 'Application not found' })
    }
  )

  it.each([{}, { 'X-Demo-Role': 'student', 'X-Demo-User-Id': 'student-1' },
    { 'X-Demo-Role': 'member', 'X-Demo-User-Id': 'member-1' },
    { 'X-Demo-Role': 'admin', 'X-Demo-User-Id': 'admin-1' },
    { 'X-Demo-Role': 'president' },
    { 'X-Demo-Role': 'president', 'X-Demo-User-Id': ' ' }])(
    'forbids missing or unauthorized demo identity %j', async headers => {
      const res = await request(app).patch(endpoint(application.id)).set(headers)
        .send({ decision: 'accepted', role: 'president', decidedBy: 'president-1' })
      expect(res.status).toBe(403)
      expect(res.body).toMatchObject({ error: true })
      expect((await request(app).get(`/applications/${application.id}`)).body).toEqual(application)
    }
  )
})
