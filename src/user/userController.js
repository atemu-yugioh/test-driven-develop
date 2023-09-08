const UserService = require('./userService')

class UserController {
  register = async (req, res, next) => {
    if (req.validationErrors) {
      return res.status(400).json({
        message: 'Error',
        status: 400,
        validationErrors: { ...req.validationErrors }
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
