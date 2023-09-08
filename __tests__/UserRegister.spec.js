const request = require('supertest')
const app = require('../src/app')
const userModel = require('../src/user/userModel')
const sequelize = require('../src/config/database')

// chạy trước khi test
beforeAll(() => {
  return sequelize.sync()
})

// trước mỗi test thực hiện clear database user
beforeEach(() => {
  return userModel.destroy({ truncate: true })
})

const validUser = {
  username: 'user1',
  email: 'user1@gmail.com',
  password: 'passUser1'
}

const postUser = (user = validUser) => {
  return request(app).post('/api/v1/users').send(user)
}

describe('User Registration', () => {
  it('Should return status 200 OK when signup request is valid', async () => {
    const response = await postUser()
    expect(response.status).toBe(200)
  })

  it('Should be return success message when signup is valid', async () => {
    const response = await postUser()
    expect(response.body.message).toBe('User created')
  })

  it('should save the username and password to database', async () => {
    await postUser()
    const userList = await userModel.findAll()
    const savedUser = userList[0]
    expect(savedUser.username).toBe('user1')
    expect(savedUser.email).toBe('user1@gmail.com')
  })

  it('Should hashes password in database', async () => {
    await postUser()
    const userList = await userModel.findAll()
    const savedUser = userList[0]
    expect(savedUser.password).not.toBe('passUser1')
  })

  it('Should be return status 400 when username is null', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@gmail.com',
      password: 'passUser1'
    })

    expect(response.status).toBe(400)
  })

  it('Should return validationErrors fields in response body when validation error occurs', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@gmail.com',
      password: 'passUser1'
    })
    const { body } = response
    expect(body.validationErrors).not.toBeUndefined()
  })

  it('Should return error for both when username and email is null', async () => {
    const response = await postUser({
      username: null,
      email: null,
      password: 'passUser1'
    })
    const { body } = response
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email'])
  })

  it.each([
    ['Username cannot be null', 'username'],
    ['Email cannot be null', 'email'],
    ['Password cannot be null', 'password']
  ])('Should be return message %s when %s is null', async (expectedMessage, field) => {
    const user = {
      username: 'user1',
      email: 'user1@gmail.com',
      password: 'passUser1'
    }

    user[field] = null
    const response = await postUser(user)
    const { body } = response
    expect(body.validationErrors[field]).toBe(expectedMessage)
  })
})
