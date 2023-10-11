const { async } = require('fast-glob')
const { randomString } = require('../shared/generator')
const TokenModel = require('./tokenModel')

class TokenService {
  static createToken = async (user) => {
    const token = randomString(32)
    await TokenModel.create({
      token,
      userId: user.id
    })
    return token
  }

  static verifyToken = async (token) => {
    const tokenInDB = await TokenModel.findOne({ where: { token } })

    return { id: tokenInDB.userId, token: tokenInDB.token }
  }

  static deleteToken = async (token) => {
    return await TokenModel.destroy({ where: { token } })
  }
}

module.exports = TokenService
