const UserService = require('./userService')

class UserController {
  register = async (req, res, next) => {
    const { username } = req.body

    if (!username) {
      return res.status(400).json({
        message: 'username null',
        status: 400,
        validationErrors: {
          username: 'Username cannot be null'
        }
      })
    }
    await UserService.save({ ...req.body })
    return res.status(200).json({
      message: 'User created',
      status: 200
    })
  }
}

module.exports = new UserController()
