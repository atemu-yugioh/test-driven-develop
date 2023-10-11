const request = require('supertest')
const app = require('../src/app')
const userModel = require('../src/user/userModel')
const sequelize = require('../src/config/database')
const bcrypt = require('bcrypt')
const en = require('../locales/en/translation.json')
const vn = require('../locales/vn/translation.json')
const tokenModel = require('../src/auth/tokenModel')

beforeAll(async () => {
  await sequelize.sync()
})

beforeEach(async () => {
  await userModel.destroy({ truncate: { cascade: true } })
})
const activeUser = {
  username: 'user1',
  email: 'user1@gmail.com',
  password: 'Password1',
  inactive: false
}

const addUser = async (user = { ...activeUser }) => {
  const passwordHash = await bcrypt.hash(user.password, 10)
  user.password = passwordHash

  return await userModel.create(user)
}

const correctCredential = {
  auth: {
    email: activeUser.email,
    password: activeUser.password
  }
}

const postLogin = async (credential = {}) => {
  let token

  if (credential.auth) {
    const response = await request(app).post('/api/1.0/auth').send(credential.auth)
    token = response.body.token
  }
  return token
}

const deleteUser = (id = 5, options = {}) => {
  const agent = request(app).delete('/api/1.0/users/' + id)
  if (options.language) {
    agent.set('accept-language', options.language)
  }

  if (options.token) {
    agent.set('authorization', `Bearer ${options.token}`)
  }

  return agent.send()
}

describe('Delete User', () => {
  it('should return status 403 when request send unauthorized', async () => {
    const response = await deleteUser()

    expect(response.status).toBe(403)
  })

  it.each`
    language | message
    ${'en'}  | ${en.unauthroized_user_delete}
    ${'vn'}  | ${vn.unauthroized_user_delete}
  `('should return correct error body with $message when language is $language', async ({ language, message }) => {
    const currentTimeRequest = new Date().getTime()
    const userId = 5
    const response = await deleteUser(userId, { language })

    const { body } = response
    expect(body.path).toBe('/api/1.0/users/' + userId)
    expect(body.timestamp).toBeGreaterThanOrEqual(currentTimeRequest)
    expect(body.message).toBe(message)
  })

  it('should return status 403 when delete request with correct credentials but different user', async () => {
    // register and login
    const savedUser = await addUser()
    const token = await postLogin({ ...correctCredential })

    // delete user
    const anotherUserId = savedUser.id + 1
    const response = await deleteUser(anotherUserId, { token })

    expect(response.status).toBe(403)
  })

  it('should return 403 when token invalid', async () => {
    const response = await deleteUser((userId = 5), { token: 'invalid token' })
    expect(response.status).toBe(403)
  })

  it('should return status 200 when delete request send with correct requirement', async () => {
    // register and login
    const savedUser = await addUser()

    const token = await postLogin({ ...correctCredential })

    // delete user
    const response = await deleteUser(savedUser.id, { token })
    expect(response.status).toBe(200)
  })

  it('should deletes user from database when request sent from authorized user', async () => {
    // register and login
    const savedUser = await addUser()

    const token = await postLogin({ ...correctCredential })

    // delete user
    await deleteUser(savedUser.id, { token })

    // get user
    const storedUser = await userModel.findOne({ where: { id: savedUser.id } })
    expect(storedUser).toBeNull()
  })

  it('should deletes token from database when delete user request sent from authorized user', async () => {
    // register and login
    const savedUser = await addUser()

    const token = await postLogin({ ...correctCredential })

    // delete user
    await deleteUser(savedUser.id, { token })

    // find token
    const storedToken = await tokenModel.findOne({ where: { token } })
    expect(storedToken).toBeNull()
  })

  it('should deletes all token from database when delete user request sent from authorized user', async () => {
    // register and login
    const savedUser = await addUser()

    const token = await postLogin({ ...correctCredential })

    // delete user
    await deleteUser(savedUser.id, { token })

    // find token
    const storedToken = await tokenModel.findAll({ where: { userId: savedUser.id } })
    expect(storedToken.length).toBeFalsy()
  })
})
