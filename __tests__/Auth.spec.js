const request = require('supertest')
const app = require('../src/app')
const UserModel = require('../src/user/userModel')
const sequelize = require('../src/config/database')
const bcrypt = require('bcrypt')

beforeAll(async () => {
  await sequelize.sync()
})

beforeEach(async () => {
  await UserModel.destroy({ truncate: true })
})

const addUser = async () => {
  const user = {
    username: 'user1',
    email: 'user1@gmail.com',
    password: 'Password1',
    inactive: false
  }

  const passwordHash = await bcrypt.hash(user.password, 10)
  user.password = passwordHash

  return await UserModel.create(user)
}

const postAuthentication = async (credential) => {
  return await request(app).post('/api/1.0/auth').send(credential)
}

describe('Authentication', () => {
  it('Should return 200 when credentials are correct ', async () => {
    await addUser()

    const credential = {
      email: 'user1@gmail.com',
      password: 'Password1'
    }

    const response = await postAuthentication(credential)

    expect(response.status).toBe(200)
  })

  it('Should return only user id and username when login success', async () => {
    const user = await addUser()

    const response = await postAuthentication({ email: 'user1@gmail.com', password: 'Password1' })

    const { body } = response

    expect(body.id).toBe(user.id)
    expect(body.username).toBe(user.username)
    expect(Object.keys(body)).toEqual(['id', 'username'])
  })
})
