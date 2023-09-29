const jwt = require('jsonwebtoken')

class TokenService {
  static createToken = async (user) => {
    return jwt.sign({ id: user.id }, 'this-is-secret-key')
  }
}

module.exports = TokenService
