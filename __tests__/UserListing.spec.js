const request = require('supertest')
const app = require('../src/app')

describe('Listing User', () => {
  it('Should return status 200 when there are no user in database', async () => {
    const response = await request(app).get('/api/1.0/users')

    expect(response.status).toBe(200)
  })

  it('should return page object as response body', async () => {
    const responese = await request(app).get('/api/1.0/users')

    expect(responese.body).toEqual({
      content: [],
      page: 0,
      size: 10,
      totalPages: 0
    })
  })
})
