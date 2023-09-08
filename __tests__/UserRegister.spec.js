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

  it.each`
    field         | value              | expectedMessage
    ${'username'} | ${null}            | ${'Username cannot be null'}
    ${'username'} | ${'usr'}           | ${'Must have min 4 and max 32 characters'}
    ${'username'} | ${'a'.repeat(33)}  | ${'Must have min 4 and max 32 characters'}
    ${'email'}    | ${null}            | ${'Email cannot be null'}
    ${'email'}    | ${'user.mail.com'} | ${'Email is not valid'}
    ${'email'}    | ${'user@gmail'}    | ${'Email is not valid'}
    ${'email'}    | ${'user.com'}      | ${'Email is not valid'}
    ${'password'} | ${null}            | ${'Password cannot be null'}
    ${'password'} | ${'pass'}          | ${'Password must be at least 6 characters'}
    ${'password'} | ${'lowercase'}     | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'UPPERCASE'}     | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'123123'}        | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'lowercase123'}  | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'UPPERCASE123'}  | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'lowerAndUPPER'} | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
  `('Should be return message $expectedMessage when $field is $value', async ({ field, expectedMessage, value }) => {
    const user = {
      username: 'user1',
      email: 'user1@gmail.com',
      password: 'passUser1'
    }

    user[field] = value
    const response = await postUser(user)
    const { body } = response
    expect(body.validationErrors[field]).toBe(expectedMessage)
  })

  it('Should be return Email in use when same email is already in use', async () => {
    await userModel.create({ ...validUser })
    const response = await postUser()
    const { body } = response
    expect(body.validationErrors.email).toBe('Email in use')
  })

  it('Should be return both Error when username is null and email in use', async () => {
    await userModel.create({ ...validUser })
    const response = await postUser({
      username: null,
      email: validUser.email,
      password: 'passUser1'
    })

    const { body } = response
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email'])
  })
})
