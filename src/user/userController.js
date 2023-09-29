const ForbiddenException = require('../errors/ForbiddenException')
const ValidationException = require('../errors/ValidationException')
const UserService = require('./userService')

const { validationResult } = require('express-validator')
class UserController {
  register = async (req, res, next) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      throw new ValidationException(errors.array())
    }

    await UserService.save({ ...req.body })
    return res.status(200).json({
      message: req.t('user_create_success'),
      status: 200
    })
  }

  activeToken = async (req, res, next) => {
    const { token } = req.params

    const user = await UserService.activeToken(token)

    return res.status(200).json({
      data: user,
      message: req.t('account_activation_success'),
      status: 200
    })
  }

  getUsers = async (req, res, next) => {
    const {
      pagination: { page, size },
      authenticateUser
    } = req

    const users = await UserService.getUsers(page, size, authenticateUser)

    return res.status(200).json(users)
  }

  getUser = async (req, res, next) => {
    const { id } = req.params

    const user = await UserService.getUser(id)

    return res.status(200).json(user)
  }

  update = async (req, res, next) => {
    const { authenticateUser } = req

    if (!authenticateUser || authenticateUser.id !== Number(req.params.id)) {
      return next(new ForbiddenException('unauthroized_user_update'))
    }

    await UserService.updateUser(req.params.id, req.body)

    return res.send()
  }
}

module.exports = new UserController()
