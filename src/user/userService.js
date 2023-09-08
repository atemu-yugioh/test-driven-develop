const bcrypt = require('bcrypt')
const UserModel = require('./userModel')

class UserService {
  static save = async ({ username, password, email }) => {
    const passwordHash = await bcrypt.hash(password, 10)
    const newUser = await UserModel.create({ username, password: passwordHash, email })
    return newUser
  }

  static findByEmail = async (email) => {
    return await UserModel.findOne({ where: { email } })
  }
}

module.exports = UserService
