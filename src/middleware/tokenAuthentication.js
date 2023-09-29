const TokenService = require('../auth/TokenService')

const tokenAuthentication = async (req, res, next) => {
  const token = req.headers.authorization

  if (token) {
    const encoded = token.substring(7)
    try {
      const user = await TokenService.verifyToken(encoded)
      req.authenticateUser = user
    } catch (error) {}
  }
  next()
}

module.exports = tokenAuthentication
