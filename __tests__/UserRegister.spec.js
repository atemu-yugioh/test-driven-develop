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

describe('User Registration', () => {
  it('Should return status 200 OK when signup request is valid', (done) => {
    request(app)
      .post('/api/v1/users')
      .send({
        username: 'user1',
        email: 'user1@gmail.com',
        password: 'passUser1'
      })
      .then((response) => {
        expect(response.status).toBe(200)
        done()
      })
  })

  it('Should be return success message when signup is valid', (done) => {
    request(app)
      .post('/api/v1/users')
      .send({
        username: 'user1',
        email: 'user1@gmail.com',
        password: 'passUser1'
      })
      .then((response) => {
        expect(response.body.message).toBe('User created')
        done()
      })
  })

  it('should save the username and password to database', (done) => {
    request(app)
      .post('/api/v1/users')
      .send({
        username: 'user1',
        email: 'user1@gmail.com',
        password: 'passUser1'
      })
      .then(() => {
        userModel.findAll().then((userList) => {
          const savedUser = userList[0]
          expect(savedUser.username).toBe('user1')
          expect(savedUser.email).toBe('user1@gmail.com')
          done()
        })
      })
  })
})
