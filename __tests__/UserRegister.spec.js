const request = require('supertest')
const app = require('../src/app')
const userModel = require('../src/user/userModel')
const sequelize = require('../src/config/database')
const SMTPServer = require('smtp-server').SMTPServer
const en = require('../locales/en/translation.json')
const vn = require('../locales/vn/translation.json')

let lastMail, server
let simulateSmtpFailure = false

// chạy trước khi test
beforeAll(async () => {
  server = new SMTPServer({
    authOptional: true,
    onData(stream, session, callback) {
      let mailBody
      stream.on('data', (data) => {
        mailBody += data.toString()
      })
      stream.on('end', () => {
        if (simulateSmtpFailure) {
          const err = new Error('Invalid mailbox')
          err.responseCode = 553
          return callback(err)
        }
        lastMail = mailBody
        callback()
      })
    }
  })

  await server.listen(8587, 'localhost')

  await sequelize.sync()
})

// trước mỗi test thực hiện clear database user
beforeEach(async () => {
  simulateSmtpFailure = false
  await userModel.destroy({ truncate: true })
})

afterAll(async () => {
  await server.close()
})

const validUser = {
  username: 'user1',
  email: 'user1@gmail.com',
  password: 'passUser1'
}

const postUser = (user = validUser, options = {}) => {
  const agent = request(app).post('/api/1.0/users')

  if (options.language) {
    agent.set('Accept-Language', options.language)
  }

  return agent.send(user)
}

describe('User Registration', () => {
  it('Should return status 200 OK when signup request is valid', async () => {
    const response = await postUser()
    expect(response.status).toBe(200)
  })

  it('Should be return success message when signup is valid', async () => {
    const response = await postUser()
    expect(response.body.message).toBe(en.user_create_success)
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
    ${'username'} | ${null}            | ${en.username_null}
    ${'username'} | ${'usr'}           | ${en.username_size}
    ${'username'} | ${'a'.repeat(33)}  | ${en.username_size}
    ${'email'}    | ${null}            | ${en.email_null}
    ${'email'}    | ${'user.mail.com'} | ${en.email_invalid}
    ${'email'}    | ${'user@gmail'}    | ${en.email_invalid}
    ${'email'}    | ${'user.com'}      | ${en.email_invalid}
    ${'password'} | ${null}            | ${en.password_null}
    ${'password'} | ${'pass'}          | ${en.password_size}
    ${'password'} | ${'lowercase'}     | ${en.password_pattern}
    ${'password'} | ${'UPPERCASE'}     | ${en.password_pattern}
    ${'password'} | ${'123123'}        | ${en.password_pattern}
    ${'password'} | ${'lowercase123'}  | ${en.password_pattern}
    ${'password'} | ${'UPPERCASE123'}  | ${en.password_pattern}
    ${'password'} | ${'lowerAndUPPER'} | ${en.password_pattern}
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

  it(`Should be return ${en.email_inuse} when same email is already in use`, async () => {
    await userModel.create({ ...validUser })
    const response = await postUser()
    const { body } = response
    expect(body.validationErrors.email).toBe(en.email_inuse)
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

  it('Should be return inactive = true when create user', async () => {
    await postUser()

    const user = await userModel.findAll()
    const savedUser = user[0]

    expect(savedUser.inactive).toBe(true)
  })

  it('Should be return inactive as true when create user even request body contain field inactive as false', async () => {
    await postUser({ ...validUser, inactive: false })

    const user = await userModel.findAll()

    const savedUser = user[0]

    expect(savedUser.inactive).toBe(true)
  })

  it('Should be return activationToken when create user', async () => {
    await postUser()
    const user = await userModel.findAll()
    const userSaved = user[0]
    expect(userSaved.activationToken).toBeTruthy()
  })

  it('Should sends an Account activation email with activationToken', async () => {
    await postUser()

    const user = await userModel.findAll()
    const userSaved = user[0]
    expect(lastMail).toContain(validUser.email)
    expect(lastMail).toContain(userSaved.activationToken)
  })

  it('Should return 502 Bad Gateway when sending email fail', async () => {
    simulateSmtpFailure = true

    const response = await postUser()

    expect(response.status).toBe(502)
  })

  it(`Should return ${en.email_failure} when sending email fail`, async () => {
    simulateSmtpFailure = true

    const response = await postUser()
    expect(response.body.message).toBe(en.email_failure)
  })

  it('Should not create user when sending email failure => Rollback transaction', async () => {
    simulateSmtpFailure = true

    await postUser()
    const user = await userModel.findAll()
    expect(user.length).toBe(0)
  })

  it(`Should return ${en.validation_fail} message in error response body when validation fail`, async () => {
    const response = await postUser({ ...validUser, username: null })

    expect(response.body.message).toBe(en.validation_fail)
  })
})

describe('Internationalization', () => {
  it.each`
    field         | value              | expectedMessage
    ${'username'} | ${null}            | ${vn.username_null}
    ${'username'} | ${'usr'}           | ${vn.username_size}
    ${'username'} | ${'a'.repeat(33)}  | ${vn.username_size}
    ${'email'}    | ${null}            | ${vn.email_null}
    ${'email'}    | ${'user.mail.com'} | ${vn.email_invalid}
    ${'email'}    | ${'user@gmail'}    | ${vn.email_invalid}
    ${'email'}    | ${'user.com'}      | ${vn.email_invalid}
    ${'password'} | ${null}            | ${vn.password_null}
    ${'password'} | ${'pass'}          | ${vn.password_size}
    ${'password'} | ${'lowercase'}     | ${vn.password_pattern}
    ${'password'} | ${'UPPERCASE'}     | ${vn.password_pattern}
    ${'password'} | ${'123123'}        | ${vn.password_pattern}
    ${'password'} | ${'lowercase123'}  | ${vn.password_pattern}
    ${'password'} | ${'UPPERCASE123'}  | ${vn.password_pattern}
    ${'password'} | ${'lowerAndUPPER'} | ${vn.password_pattern}
  `('Should be return message $expectedMessage when $field is $value', async ({ field, expectedMessage, value }) => {
    const user = {
      username: 'user1',
      email: 'user1@gmail.com',
      password: 'passUser1'
    }

    user[field] = value
    const response = await postUser(user, { language: 'vn' })
    const { body } = response
    expect(body.validationErrors[field]).toBe(expectedMessage)
  })

  it(`Should be return ${vn.email_inuse} when same email is already in use when language is set as Vietnamese`, async () => {
    await userModel.create({ ...validUser })
    const response = await postUser({ ...validUser }, { language: 'vn' })
    const { body } = response
    expect(body.validationErrors.email).toBe(vn.email_inuse)
  })

  it('Should be return both Error when username is null and email in use when language is set as Vietnamese', async () => {
    await userModel.create({ ...validUser })
    const response = await postUser({
      username: null,
      email: validUser.email,
      password: 'passUser1'
    })

    const { body } = response
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email'])
  })

  it(`Should be return ${vn.validation_fail} message in response body when validation fail with language set as Vietnamese`, async () => {
    const response = await postUser({ ...validUser, username: null }, { language: 'vn' })

    expect(response.body.message).toBe(vn.validation_fail)
  })
})

describe('Account activation', () => {
  it('Should active account when correct token is sent', async () => {
    await postUser()
    let users = await userModel.findAll()
    const token = users[0].activationToken

    await request(app).post(`/api/1.0/users/token/${token}`).send()

    users = await userModel.findAll()
    expect(users[0].inactive).toBe(false)
  })

  it('Should remove token when account active successful', async () => {
    await postUser()
    let users = await userModel.findAll()
    const token = users[0].activationToken

    await request(app).post(`/api/1.0/users/token/${token}`).send()

    users = await userModel.findAll()

    expect(users[0].activationToken).toBeFalsy()
  })

  it('Should does not active account when token wrong', async () => {
    const token = 'token-wrong'
    await postUser()

    await request(app).post(`/api/1.0/users/token/${token}`).send()

    users = await userModel.findAll()

    expect(users[0].inactive).toBe(true)
  })

  it('Should return bad request when token wrong', async () => {
    const token = 'wrong-token'

    await postUser()

    const response = await request(app).post(`/api/1.0/users/token/${token}`).send()

    expect(response.status).toBe(400)
  })

  it.each`
    language | tokenStatus  | message
    ${'vn'}  | ${'wrong'}   | ${vn.account_activation_failure}
    ${'en'}  | ${'wrong'}   | ${en.account_activation_failure}
    ${'vn'}  | ${'correct'} | ${vn.account_activation_success}
    ${'en'}  | ${'correct'} | ${en.account_activation_success}
  `(
    'Should return ${message} when token is ${tokenStatus} and languge ${language}',
    async ({ language, tokenStatus, message }) => {
      await postUser()
      let token = 'this-token-does-not-exist'

      if (tokenStatus === 'correct') {
        let users = await userModel.findAll()
        token = users[0].activationToken
      }
      const response = await request(app)
        .post('/api/1.0/users/token/' + token)
        .set('Accept-Language', language)
        .send()
      expect(response.body.message).toBe(message)
    }
  )
})

describe('Error Body', () => {
  it('Should return path, timestamp, message and validationErrors in response when validation failure', async () => {
    const response = await postUser({ ...validUser, username: null })

    const { body } = response

    expect(Object.keys(body)).toEqual(['path', 'timestamp', 'message', 'validationErrors'])
  })

  it('Should return path, message, and timestamp in respone when request fail other validation error', async () => {
    const token = 'token-does-not-exist'

    const response = await request(app)
      .post('/api/1.0/users/token/' + token)
      .send()

    const { body } = response

    expect(Object.keys(body)).toEqual(['path', 'timestamp', 'message'])
  })

  it('Should return path in error body', async () => {
    const token = 'token-does-not-exist'

    const response = await request(app)
      .post('/api/1.0/users/token/' + token)
      .send()

    const { body } = response

    expect(body.path).toBe('/api/1.0/users/token/' + token)
  })

  it('Should returns timestamp in milliseconds within 5 seconds value in error body', async () => {
    const timeSendRequest = new Date().getTime()
    const fiveSecondsLater = timeSendRequest + 5 * 1000

    const token = 'token-does-not-exist'

    const response = await request(app)
      .post('/api/1.0/users/token/' + token)
      .send()

    const { body } = response

    expect(body.timestamp).toBeGreaterThan(timeSendRequest)
    expect(body.timestamp).toBeLessThan(fiveSecondsLater)
  })
})
