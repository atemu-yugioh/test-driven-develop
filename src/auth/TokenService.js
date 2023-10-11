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

    return { id: Number(tokenInDB.userId) }
  }
}

module.exports = TokenService
