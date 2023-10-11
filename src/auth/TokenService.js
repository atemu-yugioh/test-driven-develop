const { async } = require('fast-glob')
const { randomString } = require('../shared/generator')
const TokenModel = require('./tokenModel')
const Sequelize = require('sequelize')

const ONE_WEEK_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
class TokenService {
  static createToken = async (user) => {
    const token = randomString(32)
    await TokenModel.create({
      token,
      userId: user.id,
      lastUsedAt: new Date()
    })
    return token
  }

  static verifyToken = async (token) => {
    const tokenInDB = await TokenModel.findOne({
      where: {
        token,
        lastUsedAt: {
          [Sequelize.Op.gt]: ONE_WEEK_AGO
        }
      }
    })
    // refresh expiration token when verify success
    tokenInDB.lastUsedAt = new Date()
    await tokenInDB.save()
    return { id: tokenInDB.userId, token: tokenInDB.token }
  }

  static deleteToken = async (token) => {
    return await TokenModel.destroy({ where: { token } })
  }

  static scheduleCleanup = () => {
    setInterval(async () => {
      await TokenModel.destroy({
        where: {
          lastUsedAt: {
            [Sequelize.Op.lt]: ONE_WEEK_AGO
          }
        }
      })
    }, 1000)
  }
}

module.exports = TokenService
