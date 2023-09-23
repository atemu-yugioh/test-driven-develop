const request = require('supertest')
const app = require('../src/app')
const userModel = require('../src/user/userModel')
const sequelize = require('../src/config/database')

beforeAll(async () => {
  await sequelize.sync()
})

beforeEach(() => {
  return userModel.destroy({ truncate: true })
})

const getUsers = () => {
  return request(app).get('/api/1.0/users')
}

const addUsers = async (activeUser, inActiveUser = 0) => {
  for (let i = 1; i < activeUser + inActiveUser; i++) {
    await userModel.create({
      username: `user${i}`,
      email: `user${i}@gmail.com`,
      password: `passUser${i}`,
      inactive: i > activeUser
    })
  }
}

describe('Listing User', () => {
  it('Should return status 200 when there are no user in database', async () => {
    const response = await getUsers()

    expect(response.status).toBe(200)
  })

  it('should return page object as response body', async () => {
    const responese = await getUsers()

    expect(responese.body).toEqual({
      content: [],
      page: 0,
      size: 10,
      totalPages: 0
    })
  })

  it('should return 10 users in page content when have 11 user in database', async () => {
    await addUsers(11)

    const response = await getUsers()

    const { body } = response

    expect(body.content.length).toBe(10)
  })

  it('should return 6 users in page content when have 6 users active and 5 users inactive in database', async () => {
    await addUsers(6, 5)

    const response = await getUsers()

    const { body } = response

    expect(body.content.length).toBe(6)
  })

  it('should return id, username and email in content array for each user', async () => {
    await addUsers(11)

    const response = await getUsers()

    const {
      body: { content }
    } = response

    const firstUser = content[0]

    expect(Object.keys(firstUser)).toEqual(['id', 'username', 'email'])
  })
})
