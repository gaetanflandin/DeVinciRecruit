import request from 'supertest'
import { beforeEach, describe, it, expect, vi } from 'vitest'

let app
const base = '/api/associations'
const validProfile = {
  name: 'Test Association',
  description: 'A student association for testing.',
  category: 'Technology',
  logoUrl: 'https://example.com/test.png'
}

beforeEach(async () => {
  // Reload the app and its in-memory routers for an isolated fixture per test.
  vi.resetModules()
  app = (await import('../src/app.js')).default
})

describe('Associations CRUD API', () => {
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

describe('Association mutations and lookup', () => {
  it('retrieves an association by ID', async () => {
    const res = await request(app).get(`${base}/1`)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ id: 1, name: 'Vinci Racing Team' })
  })

  it.each(['999999', '1abc', '1.5', '-1', '9007199254740992'])(
    'returns 404 for unknown or malformed ID %s', async id => {
      for (const method of ['get', 'put', 'delete']) {
        const res = await request(app)[method](`${base}/${id}`).send(validProfile)
        expect(res.status).toBe(404)
        expect(res.body).toEqual({ error: true, message: 'Association not found' })
      }
    }
  )

  it('creates and persists a profile with a server-generated ID', async () => {
    const res = await request(app).post(base).send({ ...validProfile, id: 1, extra: 'ignored' })
    expect(res.status).toBe(201)
    expect(res.body).toEqual({ id: 3, ...validProfile })
    expect(res.headers.location).toBe(`${base}/3`)
    expect((await request(app).get(`${base}/3`)).body).toEqual(res.body)
  })

  it.each(['name', 'description', 'category', 'logoUrl'])(
    'rejects missing or invalid %s on POST and PUT', async field => {
      for (const value of [undefined, '', '   ', 42, null, [], {}]) {
        const body = { ...validProfile, [field]: value }
        for (const [method, url] of [['post', base], ['put', `${base}/1`]]) {
          const res = await request(app)[method](url).send(body)
          expect(res.status).toBe(400)
          expect(res.body).toMatchObject({ error: true, message: expect.any(String) })
        }
      }
      expect((await request(app).get(base)).body).toHaveLength(2)
      expect((await request(app).get(`${base}/1`)).body.name).toBe('Vinci Racing Team')
    }
  )

  it('rejects an absent request body', async () => {
    for (const [method, url] of [['post', base], ['put', `${base}/1`]]) {
      expect((await request(app)[method](url)).status).toBe(400)
    }
  })

  it('updates a profile while preserving its ID and schema', async () => {
    const res = await request(app).put(`${base}/1`)
      .send({ ...validProfile, name: ' Updated Club ', id: 99, extra: true })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ...validProfile, id: 1, name: 'Updated Club' })
    expect((await request(app).get(`${base}/1`)).body).toEqual(res.body)
  })

  it('deletes an association and returns an empty response', async () => {
    const res = await request(app).delete(`${base}/1`)
    expect(res.status).toBe(204)
    expect(res.text).toBe('')
    expect((await request(app).get(`${base}/1`)).status).toBe(404)
    expect((await request(app).get(base)).body.map(item => item.id)).toEqual([2])
    expect((await request(app).delete(`${base}/1`)).status).toBe(404)
  })

  it('never reuses IDs after deleting sample or newly created profiles', async () => {
    await request(app).delete(`${base}/1`)
    const first = await request(app).post(base).send(validProfile)
    expect(first.body.id).toBe(3)
    await request(app).delete(`${base}/${first.body.id}`)
    const second = await request(app).post(base).send(validProfile)
    expect(second.body.id).toBeGreaterThan(first.body.id)
    const all = (await request(app).get(base)).body
    expect(new Set(all.map(item => item.id)).size).toBe(all.length)
  })
})
