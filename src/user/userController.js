const ValidationException = require('../errors/ValidationException')
const UserService = require('./userService')
const { validationResult } = require('express-validator')
class UserController {
  register = async (req, res, next) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      throw new ValidationException(errors.array())
    }

    try {
      await UserService.save({ ...req.body })
      return res.status(200).json({
        message: req.t('user_create_success'),
        status: 200
      })
    } catch (error) {
      next(error)
    }
  }

  activeToken = async (req, res, next) => {
    try {
      const { token } = req.params

      const user = await UserService.activeToken(token)

      return res.status(200).json({
        data: user,
        message: req.t('account_activation_success'),
        status: 200
      })
    } catch (error) {
      next(error)
    }
  }

  getUsers = async (req, res, next) => {
    const users = await UserService.getUsers()

    return res.status(200).json(users)
  }
}

module.exports = new UserController()
