const Sequelize = require('sequelize')
const sequelize = require('../config/database')
const TokenModel = require('../auth/tokenModel')

const Model = Sequelize.Model

class UserModel extends Model {}

UserModel.init(
  {
    username: {
      type: Sequelize.STRING
    },
    email: {
      type: Sequelize.STRING
    },
    password: {
      type: Sequelize.STRING
    },
    inactive: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    activationToken: {
      type: Sequelize.STRING
    }
  },
  {
    sequelize,
    modelName: 'user'
  }
)

// onDelete: 'cascade' => khi user bị xóa thì tất cả các token relationship với user cũng bị xóa hết
UserModel.hasMany(TokenModel, { onDelete: 'cascade', foreignKey: 'userId' })

module.exports = UserModel
