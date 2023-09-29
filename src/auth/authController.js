const UserService = require('../user/userService')

class AuthController {
  auth = async (req, res, next) => {
    const { email } = req.body

    const user = await UserService.findByEmail(email)

    return res.status(200).json({
      id: user.id,
      username: user.username
    })
  }
}

module.exports = new AuthController()
