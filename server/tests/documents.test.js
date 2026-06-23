import request from 'supertest'
import app from '../app.js'

describe('POST /api/documents', () => {
  it('returns 401 when no Authorization header is provided', async () => {
    const res = await request(app)
      .post('/api/documents')
      .send({ title: 'Test Doc' })

    expect(res.status).toBe(401)
    expect(res.body.error).toBeDefined()
  })
})
