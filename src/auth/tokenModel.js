const Sequelize = require('sequelize')
const sequelize = require('../config/database')

const Model = Sequelize.Model

class TokenModel extends Model {}

TokenModel.init(
  {
    token: {
      type: Sequelize.STRING
    },
    userId: {
      type: Sequelize.INTEGER
    },
    lastUsedAt: {
      type: Sequelize.DATE
    }
  },
  {
    sequelize,
    modelName: 'token',
    timestamps: false
  }
)

module.exports = TokenModel
