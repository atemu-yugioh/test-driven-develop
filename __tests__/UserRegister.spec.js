const request = require('supertest')
const app = require('../src/app')
const userModel = require('../src/user/userModel')
const sequelize = require('../src/config/database')
const nodemailerStub = require('nodemailer-stub')
const EmailService = require('../src/email/emailService')
const SMTPServer = require('smtp-server').SMTPServer

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
beforeEach(() => {
  simulateSmtpFailure = false
  return userModel.destroy({ truncate: true })
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
  const agent = request(app).post('/api/v1/users')

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

  const usernameNull = 'Username cannot be null'
  const usernameSize = 'Must have min 4 and max 32 characters'
  const emailNull = 'E-mail cannot be null'
  const emailInvalid = 'E-mail is not valid'
  const passwordNull = 'Password cannot be null'
  const passwordSize = 'Password must be at least 6 characters'
  const passwordPattern = 'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'
  const emailInuse = 'E-mail in use'

  it.each`
    field         | value              | expectedMessage
    ${'username'} | ${null}            | ${usernameNull}
    ${'username'} | ${'usr'}           | ${usernameSize}
    ${'username'} | ${'a'.repeat(33)}  | ${usernameSize}
    ${'email'}    | ${null}            | ${emailNull}
    ${'email'}    | ${'user.mail.com'} | ${emailInvalid}
    ${'email'}    | ${'user@gmail'}    | ${emailInvalid}
    ${'email'}    | ${'user.com'}      | ${emailInvalid}
    ${'password'} | ${null}            | ${passwordNull}
    ${'password'} | ${'pass'}          | ${passwordSize}
    ${'password'} | ${'lowercase'}     | ${passwordPattern}
    ${'password'} | ${'UPPERCASE'}     | ${passwordPattern}
    ${'password'} | ${'123123'}        | ${passwordPattern}
    ${'password'} | ${'lowercase123'}  | ${passwordPattern}
    ${'password'} | ${'UPPERCASE123'}  | ${passwordPattern}
    ${'password'} | ${'lowerAndUPPER'} | ${passwordPattern}
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

  it(`Should be return ${emailInuse} when same email is already in use`, async () => {
    await userModel.create({ ...validUser })
    const response = await postUser()
    const { body } = response
    expect(body.validationErrors.email).toBe(emailInuse)
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

  it('Should return E-mail Failure when sending email fail', async () => {
    simulateSmtpFailure = true

    const response = await postUser()
    expect(response.body.message).toBe('E-mail Failure')
  })

  it('Should not create user when sending email failure => Rollback transaction', async () => {
    simulateSmtpFailure = true

    await postUser()
    const user = await userModel.findAll()
    expect(user.length).toBe(0)
  })
})

describe('Internationalization', () => {
  const usernameNull = 'Tên đăng nhập dùng không được null'
  const usernameSize = 'Tên đăng nhập phải từ 4 đến 32 kí tự'
  const emailNull = 'E-mail không được null'
  const emailInvalid = 'E-mail không hợp lệ'
  const passwordNull = 'Mật Khẩu null'
  const passwordSize = 'Mật khẩu phải có ít nhất 6 kí tự'
  const passwordPattern = 'Mật khẩu phải có ít nhất 1 kí tự viết hoa, 1 kí tự viết thường, 1 chữ số'
  const emailInuse = 'E-mail đã được sử dụng'
  const userCreateSuccess = 'Tạo tài khoản thành công'

  it.each`
    field         | value              | expectedMessage
    ${'username'} | ${null}            | ${usernameNull}
    ${'username'} | ${'usr'}           | ${usernameSize}
    ${'username'} | ${'a'.repeat(33)}  | ${usernameSize}
    ${'email'}    | ${null}            | ${emailNull}
    ${'email'}    | ${'user.mail.com'} | ${emailInvalid}
    ${'email'}    | ${'user@gmail'}    | ${emailInvalid}
    ${'email'}    | ${'user.com'}      | ${emailInvalid}
    ${'password'} | ${null}            | ${passwordNull}
    ${'password'} | ${'pass'}          | ${passwordSize}
    ${'password'} | ${'lowercase'}     | ${passwordPattern}
    ${'password'} | ${'UPPERCASE'}     | ${passwordPattern}
    ${'password'} | ${'123123'}        | ${passwordPattern}
    ${'password'} | ${'lowercase123'}  | ${passwordPattern}
    ${'password'} | ${'UPPERCASE123'}  | ${passwordPattern}
    ${'password'} | ${'lowerAndUPPER'} | ${passwordPattern}
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

  it(`Should be return ${emailInuse} when same email is already in use when language is set as Vietnamese`, async () => {
    await userModel.create({ ...validUser })
    const response = await postUser({ ...validUser }, { language: 'vn' })
    const { body } = response
    expect(body.validationErrors.email).toBe(emailInuse)
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
})
