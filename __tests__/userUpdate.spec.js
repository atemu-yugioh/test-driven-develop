const request = require('supertest')
const app = require('../src/app')
const userModel = require('../src/user/userModel')
const sequelize = require('../src/config/database')
const bcrypt = require('bcrypt')
const en = require('../locales/en/translation.json')
const vn = require('../locales/vn/translation.json')

beforeAll(async () => {
  await sequelize.sync()
})

beforeEach(async () => {
  await userModel.destroy({ truncate: true })
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

const putUser = (id = 5, body = null, options = {}) => {
  const agent = request(app).patch(`/api/1.0/users/${id}`)

  if (options.language) {
    agent.set('Accept-language', options.language)
  }

  if (options.auth) {
    const { email, password } = options.auth
    agent.auth(email, password, { type: 'basic' })
  }

  return agent.send(body)
}

describe('User Update', () => {
  it('should return status 403 when request sent without basic authorization', async () => {
    const id = 5
    const response = await putUser()
    expect(response.status).toBe(403)
  })

  it.each`
    language | message
    ${'en'}  | ${en.unauthroized_user_update}
    ${'vn'}  | ${vn.unauthroized_user_update}
  `(
    'Should return message $message and error body when unauthorized with language is $language',
    async ({ language, message }) => {
      const nowTimeRequest = new Date().getTime()

      const response = await putUser(5, null, { language })
      const { body } = response
      expect(body.path).toBe(`/api/1.0/users/5`)
      expect(body.timestamp).toBeGreaterThanOrEqual(nowTimeRequest)
      expect(body.message).toBe(message)
    }
  )

  it('should returns forbidden when request sent with incorrect email in basic authorization', async () => {
    await addUser()

    const response = await putUser(5, null, { auth: { email: 'user1000@mail.com', password: 'P4ssword' } })

    expect(response.status).toBe(403)
  })

  it('returns forbidden when request sent with incorrect password in basic authorization', async () => {
    await addUser()
    const response = await putUser(5, null, { auth: { email: 'user1@mail.com', password: 'password' } })
    expect(response.status).toBe(403)
  })

  it('should returns forbidden when update request is sent with correct credentials but for different user', async () => {
    await addUser()

    const userToBeUpdated = await addUser({ ...activeUser, username: 'user2', email: 'user2@mail.com' })

    const response = await putUser(userToBeUpdated.id, null, {
      auth: { email: 'user1@mail.com', password: 'P4ssword' }
    })
  })

  it('returns forbidden when update request is sent by inactive user with correct credentials for its own user', async () => {
    const inactiveUser = await addUser({ ...activeUser, inactive: true })
    const response = await putUser(inactiveUser.id, null, {
      auth: { email: 'user1@mail.com', password: 'P4ssword' }
    })
    expect(response.status).toBe(403)
  })

  it('should return status 200 when valid update request sent from authorized user', async () => {
    const saveUser = await addUser({ ...activeUser })
    const validUpdate = { username: 'username-updated' }
    const response = await putUser(saveUser.id, validUpdate, {
      auth: { email: activeUser.email, password: activeUser.password }
    })

    expect(response.status).toBe(200)
  })

  it('should update user in database when valid update request sent from authorized user', async () => {
    const saveUser = await addUser({ ...activeUser })

    const validUpdated = { username: 'username-updated' }

    await putUser(saveUser.id, validUpdated, { auth: { email: activeUser.email, password: activeUser.password } })

    const userJustUpdated = await userModel.findOne({ where: { id: saveUser.id } })

    expect(userJustUpdated.username).toBe(validUpdated.username)
  })
})
