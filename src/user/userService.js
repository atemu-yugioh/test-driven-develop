const bcrypt = require('bcrypt')
const crypto = require('crypto')
const UserModel = require('./userModel')
const EmailService = require('../email/emailService')

const generateToken = (length) => {
  return crypto.randomBytes(length).toString('hex')
}

class UserService {
  static save = async ({ username, password, email }) => {
    const passwordHash = await bcrypt.hash(password, 10)
    const newUser = await UserModel.create({
      username,
      password: passwordHash,
      email,
      activationToken: generateToken(16)
    })

    await EmailService.sendAccountActivation(email, newUser.activationToken)
    return newUser
  }

  static findByEmail = async (email) => {
    return await UserModel.findOne({ where: { email } })
  }
}

module.exports = UserService
