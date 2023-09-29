const request = require('supertest')
const app = require('../src/app')
const userModel = require('../src/user/userModel')
const sequelize = require('../src/config/database')
const en = require('../locales/en/translation.json')
const vn = require('../locales/vn/translation.json')

beforeAll(async () => {
  await sequelize.sync()
})

beforeEach(async () => {
  await userModel.destroy({ truncate: true })
})

const getUsers = () => {
  return request(app).get('/api/1.0/users')
}

const addUsers = async (activeUser, inActiveUser = 0) => {
  for (let i = 1; i <= activeUser + inActiveUser; i++) {
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

  it('should return second page content user and page indicator when set page parameter as 1', async () => {
    await addUsers(11)

    const response = await getUsers().query({ page: 1 })

    expect(response.body.content[0].username).toBe('user11')
    expect(response.body.page).toBe(1)
  })

  it('should return first page when set page parameter below zero', async () => {
    await addUsers(11)

    const response = await getUsers().query({ page: -5 })

    expect(response.body.content[0].username).toBe('user1')
    expect(response.body.page).toBe(0)
  })

  it('should return 5 users and corresponding size indicator when size is set 5 in parameter', async () => {
    await addUsers(11)

    const response = await getUsers().query({ size: 5 })

    const { body } = response

    expect(body.content.length).toBe(5)
    expect(body.size).toBe(5)
  })

  it('should return 10 users and corresponding size indicator when size is set 1000 in parameter ', async () => {
    await addUsers(11)

    const response = await getUsers().query({ size: 1000 })

    const { body } = response

    expect(body.content.length).toBe(10)
    expect(body.size).toBe(10)
  })

  it('should returns 10 users and corresponding size indicator when size is set as 0', async () => {
    await addUsers(11)

    const response = await getUsers().query({ size: 0 })

    const { body } = response

    expect(body.content.length).toBe(10)
    expect(body.size).toBe(10)
  })

  it('should returns page as zero and size as 10 when non numeric query params provided for both', async () => {
    await addUsers(11)

    const response = await getUsers().query({ page: 'page', size: 'size' })

    const { body } = response

    expect(body.content.length).toBe(10)
    expect(body.size).toBe(10)
  })
})

describe('Detail User', () => {
  const getUser = (id) => {
    return request(app).get('/api/1.0/users/' + id)
  }

  it('should return 404 when user not found', async () => {
    const response = await getUser()
    expect(response.status).toBe(404)
  })

  it.each`
    language | message
    ${'vn'}  | ${vn.user_not_found}
    ${'en'}  | ${en.user_not_found}
  `('Should return $message for unknow user when language is set to $language', async ({ language, message }) => {
    const response = await getUser().set('Accept-Language', language)

    expect(response.body.message).toBe(message)
  })

  it('should returns proper error body when user not found', async () => {
    const timeStart = new Date().getTime()

    const response = await getUser(5)

    const { body } = response

    expect(body.path).toBe('/api/1.0/users/5')
    expect(body.timestamp).toBeGreaterThan(timeStart)
    expect(Object.keys(body)).toEqual(['path', 'timestamp', 'message'])
  })

  it('should returns 200 when an active user exist', async () => {
    const user = await userModel.create({
      username: 'user1',
      email: 'user1@gmail.com',
      password: 'passUser1',
      inactive: false
    })

    const response = await getUser(user.id)

    expect(response.status).toBe(200)
  })

  it('should returns id, username and email in response body when an active user exist', async () => {
    const user = await userModel.create({
      username: 'user1',
      email: 'user1@gmail.com',
      password: 'passUser1',
      inactive: false
    })

    const response = await getUser(user.id)

    const { body: newUser } = response

    expect(Object.keys(newUser)).toEqual(['id', 'username', 'email'])
  })

  it('should returns 404 when the user is inactive', async () => {
    const user = await userModel.create({
      username: 'user1',
      email: 'user1@gmail.com',
      password: 'passUser1',
      inactive: true
    })

    const response = await getUser(user.id)

    expect(response.status).toBe(404)
  })
})
