const UserService = require('./userService')

class UserController {
  register = async (req, res, next) => {
    await UserService.save({ ...req.body })
    return res.status(200).json({
      message: 'User created',
      status: 200
    })
  }
}

module.exports = new UserController()
