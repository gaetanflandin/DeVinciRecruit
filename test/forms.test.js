import request from 'supertest'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

let app
let applicationStore
const base = '/api/forms'
const valid = {
  associationId: 1,
  title: 'Engineering recruitment',
  fields: [{ name: 'motivation', type: 'textarea', label: 'Motivation', required: true }],
  openDate: '2026-11-01',
  closeDate: '2026-12-01'
}

beforeEach(async () => {
  vi.resetModules()
  app = (await import('../src/app.js')).default
  applicationStore = await import('../src/routes/auto/applications_form.route.js')
})
afterEach(() => vi.restoreAllMocks())

async function create (body = valid) {
  const res = await request(app).post(base).send(body)
  expect(res.status).toBe(201)
  return res.body
}

describe('Application Forms CRUD', () => {
  it('lists an initially empty dataset and persisted forms', async () => {
    expect((await request(app).get(base)).body).toEqual([])
    const form = await create()
    const res = await request(app).get(base)
    expect(res.status).toBe(200)
    expect(res.body).toEqual([form])
  })

  it('creates and retrieves a form with an optional template', async () => {
    const res = await request(app).post(base).send({ ...valid, templateId: 2, id: 99, extra: true })
    expect(res.status).toBe(201)
    expect(res.headers.location).toBe(`${base}/1`)
    expect(res.body).toEqual({ ...valid, id: 1, templateId: 2 })
    const found = await request(app).get(`${base}/1`)
    expect(found.status).toBe(200)
    expect(found.body).toEqual(res.body)
  })

  it('replaces a form while retaining its ID and removing omitted templateId', async () => {
    const form = await create({ ...valid, templateId: 2 })
    const body = { ...valid, title: ' Updated ', fields: [{ name: 'team', type: 'select', options: [' Design ', 'Build'] }] }
    const res = await request(app).put(`${base}/${form.id}`).send({ ...body, id: 99 })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ...body, id: form.id, title: 'Updated', fields: [{ name: 'team', type: 'select', options: ['Design', 'Build'] }] })
    expect((await request(app).get(`${base}/${form.id}`)).body).toEqual(res.body)
  })

  it('deletes forms without reusing IDs, including after deleting all forms', async () => {
    const first = await create()
    const second = await create()
    const res = await request(app).delete(`${base}/${first.id}`)
    expect(res.status).toBe(204)
    expect(res.text).toBe('')
    expect((await request(app).get(`${base}/${first.id}`)).status).toBe(404)
    await request(app).delete(`${base}/${second.id}`)
    const third = await create()
    expect(third.id).toBeGreaterThan(second.id)
  })

  it.each(['99999', '1abc', '1.5', '-1', '9007199254740992'])(
    'returns 404 for missing or malformed ID %s', async id => {
      for (const method of ['get', 'put', 'delete']) {
        const res = await request(app)[method](`${base}/${id}`).send(valid)
        expect(res.status).toBe(404)
        expect(res.body).toEqual({ error: true, message: 'Application form not found' })
      }
    }
  )

  const invalid = [
    {}, { associationId: null }, { associationId: '1' }, { associationId: 0 },
    { templateId: null }, { templateId: -1 }, { title: ' ' }, { title: 1 },
    { openDate: 'invalid' }, { openDate: '2026-02-30' }, { openDate: 1 },
    { closeDate: '2026-11-01' }, { closeDate: '2026-10-01' },
    { fields: null }, { fields: [] }, { fields: ['text'] }, { fields: [null] },
    { fields: [{ name: 'x', type: 'unsupported' }] },
    { fields: [{ name: 'x', type: 'text', required: 'yes' }] },
    { fields: [{ name: 'x', type: 'text', label: '' }] },
    { fields: [{ name: 'x', type: 'text' }, { name: ' x ', type: 'email' }] },
    { fields: [{ name: 'x', type: 'select' }] },
    { fields: [{ name: 'x', type: 'select', options: [] }] },
    { fields: [{ name: 'x', type: 'select', options: [' '] }] }
  ]
  it.each(invalid)('rejects invalid values %j without mutation or consuming IDs', async patch => {
    const form = await create()
    const body = Object.keys(patch).length ? { ...valid, ...patch } : {}
    for (const [method, url] of [['post', base], ['put', `${base}/${form.id}`]]) {
      const res = await request(app)[method](url).send(body)
      expect(res.status).toBe(400)
      expect(res.body).toMatchObject({ error: true, message: expect.any(String) })
    }
    expect((await request(app).get(`${base}/${form.id}`)).body).toEqual(form)
    expect((await create()).id).toBe(form.id + 1)
  })

  it('rejects missing request bodies', async () => {
    const form = await create()
    expect((await request(app).post(base)).status).toBe(400)
    expect((await request(app).put(`${base}/${form.id}`)).status).toBe(400)
  })

  it('accepts UTC timestamps and minimal field definitions', async () => {
    const form = await create({ ...valid, fields: [{ name: 'name', type: 'text' }], openDate: '2026-11-01T10:00:00Z', closeDate: '2026-12-01T10:00:00.000Z' })
    expect(form.fields).toEqual([{ name: 'name', type: 'text' }])
  })

  it('protects referenced forms through the shared application-store contract', async () => {
    const form = await create()
    // The current POST /applications has no formId. Simulate the future store's
    // reference lookup without adding a competing Student Applications API.
    const lookup = vi.spyOn(applicationStore, 'hasApplicationsForForm').mockReturnValue(true)
    expect((await request(app).delete(`${base}/${form.id}`)).status).toBe(409)
    expect(lookup).toHaveBeenCalledWith(form.id)
    expect((await request(app).put(`${base}/${form.id}`).send({ ...valid, associationId: 2 })).status).toBe(409)
    expect((await request(app).get(`${base}/${form.id}`)).body).toEqual(form)
    expect((await request(app).put(`${base}/${form.id}`).send({ ...valid, title: 'Updated' })).status).toBe(200)
  })

  it('checks the existing application store without treating unlinked applications as references', async () => {
    await request(app).post('/applications').send({ firstName: 'Alice', lastName: 'Martin', email: 'forms@example.com', year: 3, major: 'Engineering', motivation: 'I would like to help with student projects.' })
    const form = await create()
    expect(applicationStore.hasApplicationsForForm(form.id)).toBe(false)
    expect((await request(app).delete(`${base}/${form.id}`)).status).toBe(204)
    expect((await request(app).get('/applications')).body).toHaveLength(1)
  })
})
