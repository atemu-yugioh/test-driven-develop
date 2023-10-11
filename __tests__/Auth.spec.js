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
  email: 'user1@gmail.com',
  password: 'Password1'
}

const postAuthentication = async (credential, options = {}) => {
  let agent = request(app).post('/api/1.0/auth')

  if (options.language) {
    agent.set('Accept-language', options.language)
  }

  return await agent.send(credential)
}

const postLogout = async (options = {}) => {
  const agent = request(app).post('/api/1.0/logout')

  if (options.token) {
    agent.set('authorization', `Bearer ${options.token}`)
  }

  return agent.send()
}

describe('Authentication', () => {
  it('Should return 200 when credentials are correct ', async () => {
    await addUser()

    const response = await postAuthentication(correctCredential)

    expect(response.status).toBe(200)
  })

  it('Should return only user id, username and token when login success', async () => {
    const user = await addUser()

    const response = await postAuthentication(correctCredential)

    const { body } = response

    expect(body.id).toBe(user.id)
    expect(body.username).toBe(user.username)
    expect(Object.keys(body)).toEqual(['id', 'username', 'token'])
  })

  it('should return status 401 when user not exist', async () => {
    const response = await postAuthentication(correctCredential)
    expect(response.status).toBe(401)
  })

  it('should return token in body when credential are correct', async () => {
    await addUser()

    const response = await postAuthentication(correctCredential)

    const { body } = response

    expect(body.token).not.toBeUndefined()
  })

  it('should return proper error body when authentication fail', async () => {
    const nowTimeRequest = new Date().getTime()

    const response = await postAuthentication(correctCredential)

    const { body } = response

    expect(body.path).toBe('/api/1.0/auth')
    expect(body.timestamp).toBeGreaterThanOrEqual(nowTimeRequest)
    expect(Object.keys(body)).toEqual(['path', 'timestamp', 'message'])
  })

  it.each`
    language | message
    ${'en'}  | ${en.authentication_failure}
    ${'vn'}  | ${vn.authentication_failure}
  `(
    'Should return message $message when authentication fail with language set is $language',
    async ({ language, message }) => {
      const response = await postAuthentication(correctCredential, { language })

      expect(response.body.message).toBe(message)
    }
  )

  it('should return 401 when password wrong', async () => {
    await addUser()
    const response = await postAuthentication({ ...correctCredential, password: 'wrongPassword' })

    expect(response.status).toBe(401)
  })

  it('should return status 403 when logging in with an inactive account', async () => {
    await addUser({ ...activeUser, inactive: true })
    const response = await postAuthentication(correctCredential)
    expect(response.status).toBe(403)
  })

  it('should return proper error when authentication invalid account', async () => {
    const nowTimeRequest = new Date().getTime()

    // create inactive user
    await addUser({ ...activeUser, inactive: true })

    const response = await postAuthentication(correctCredential)
    const { body } = response
    expect(body.path).toBe('/api/1.0/auth')
    expect(body.timestamp).toBeGreaterThanOrEqual(nowTimeRequest)
    expect(Object.keys(body)).toEqual(['path', 'timestamp', 'message'])
  })

  it.each`
    language | message
    ${'en'}  | ${en.inactive_authentication_failure}
    ${'vn'}  | ${vn.inactive_authentication_failure}
  `(
    'Should return $message when authentication inactive account with language is $language',
    async ({ language, message }) => {
      // create inactive user
      await addUser({ ...activeUser, inactive: true })

      const response = await postAuthentication(correctCredential, { language })
      const { body } = response

      expect(body.message).toBe(message)
    }
  )

  it('should return status 401 when email is not valid', async () => {
    await addUser()
    const response = await postAuthentication({ ...correctCredential, email: 'invalidEmail.com' })

    expect(response.status).toBe(401)
  })

  it('should return status 401 when password is not valid', async () => {
    await addUser()
    const response = await postAuthentication({ ...correctCredential, password: 'invalidPassword' })

    expect(response.status).toBe(401)
  })
})

describe('Logout', () => {
  it('should return status 401 when unauthorized request send for logout', async () => {
    const response = await postLogout()
    expect(response.status).toBe(401)
  })

  it('should remove token from database', async () => {
    // register and login
    await addUser()
    const response = await postAuthentication(correctCredential)

    const { body } = response

    const token = body.token

    // logout with valid token
    await postLogout({ token })

    const storedToken = await tokenModel.findOne({ where: { token } })

    expect(storedToken).toBeNull()
  })
})

describe('Token Expiration', () => {
  const putUser = async (id = 5, body = null, options = {}) => {
    const agent = request(app).patch(`/api/1.0/users/${id}`)

    if (options.token) {
      agent.set('authorization', `Bearer ${options.token}`)
    }

    return agent.send(body)
  }

  it('should returns 403 when token is older than 1 week', async () => {
    // register and create token for user with lastUsedAt = oneWeekAgo
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 61 * 1000)
    const savedUser = await addUser()
    const tokenFake = 'tokenValidFake'
    await tokenModel.create({
      token: tokenFake,
      userId: savedUser.id,
      lastUsedAt: oneWeekAgo
    })

    // call api update user with token expired
    const validateUpdate = { username: 'user-update' }
    const response = await putUser(savedUser.id, validateUpdate, { token: tokenFake })
    expect(response.status).toBe(403)
  })

  it('should refreshes lastUsedAt when unexpired token is used', async () => {
    // register and create token for user with lastUsedAt = fourDayAgo
    const rightTimeBeforeRequest = new Date().getTime()
    const fourDayAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    const savedUser = await addUser()
    const tokenFake = 'tokenValidFake'
    await tokenModel.create({
      token: tokenFake,
      userId: savedUser.id,
      lastUsedAt: fourDayAgo
    })

    // call api update user with token expired
    const validateUpdate = { username: 'user-update' }
    await putUser(savedUser.id, validateUpdate, { token: tokenFake })

    // get token of user
    const response = await tokenModel.findOne({ where: { token: tokenFake } })

    expect(response.lastUsedAt.getTime()).toBeGreaterThanOrEqual(rightTimeBeforeRequest)
  })
})
