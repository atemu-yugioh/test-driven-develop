const UserService = require('../user/userService')
const AuthenticationException = require('./AuthenticationException')
const bcrypt = require('bcrypt')
const ForbiddenException = require('../errors/ForbiddenException')
const { validationResult } = require('express-validator')
const TokenService = require('./TokenService')

class AuthController {
  auth = async (req, res, next) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      return next(new AuthenticationException())
    }

    const { email, password } = req.body

    const user = await UserService.findByEmail(email)

    if (!user) {
      return next(new AuthenticationException())
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return next(new AuthenticationException())
    }

    if (user.inactive) {
      return next(new ForbiddenException())
    }

    const token = await TokenService.createToken(user)
    return res.status(200).json({
      id: user.id,
      username: user.username,
      token
    })
  }
}

module.exports = new AuthController()
