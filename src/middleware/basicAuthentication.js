const bcrypt = require('bcrypt')
const UserService = require('../user/userService')

const basicAuthentication = async (req, res, next) => {
  const authorization = req.headers.authorization

  if (authorization) {
    const encoded = authorization.substring(6)
    const decoded = Buffer.from(encoded, 'base64').toString('ascii')
    const [email, password] = decoded.split(':')

    const userFound = await UserService.findByEmail(email)

    if (userFound && !userFound.inactive) {
      const isMatch = await bcrypt.compare(password, userFound.password)

      if (isMatch) {
        req.authenticateUser = userFound
      }
    }
  }

  return next()
}

module.exports = basicAuthentication
