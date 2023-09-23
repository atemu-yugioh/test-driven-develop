const bcrypt = require('bcrypt')
const crypto = require('crypto')
const UserModel = require('./userModel')
const EmailService = require('../email/emailService')
const sequelize = require('../config/database')
const { EmailException } = require('../email/emailException')
const InvalidTokenException = require('./InvalidTokenException')
const UserNotFoundException = require('./userNotFoundException')

const generateToken = (length) => {
  return crypto.randomBytes(length).toString('hex')
}

const attributes = ['id', 'username', 'email']

class UserService {
  static save = async ({ username, password, email }) => {
    const passwordHash = await bcrypt.hash(password, 10)
    const userData = {
      username,
      password: passwordHash,
      email,
      activationToken: generateToken(16)
    }
    const transaction = await sequelize.transaction()
    await UserModel.create(userData, { transaction })

    try {
      await EmailService.sendAccountActivation(email, userData.activationToken)
      await transaction.commit()
    } catch (error) {
      await transaction.rollback()
      throw new EmailException()
    }
  }

  static findByEmail = async (email) => {
    return await UserModel.findOne({ where: { email } })
  }

  static activeToken = async (token) => {
    const user = await UserModel.findOne({ where: { activationToken: token } })

    if (!user) {
      throw new InvalidTokenException()
    }

    user.inactive = false
    user.activationToken = null
    await user.save()

    return user
  }

  static getUsers = async (page, size) => {
    const userswithCount = await UserModel.findAndCountAll({
      where: { inactive: false },
      attributes,
      limit: size,
      offset: page * size
    })
    return {
      content: userswithCount.rows,
      page,
      size,
      totalPages: Math.ceil(userswithCount.count / size)
    }
  }

  static getUser = async (id) => {
    const user = await UserModel.findOne({
      where: {
        id,
        inactive: false
      },
      attributes
    })

    if (!user) {
      throw new UserNotFoundException()
    }

    return user
  }
}

module.exports = UserService
