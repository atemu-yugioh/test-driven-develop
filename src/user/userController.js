const UserService = require('./userService')
const { validationResult } = require('express-validator')
class UserController {
  register = async (req, res, next) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      const validationErrors = {}

      errors.array().forEach((error) => (validationErrors[error.path] = req.t(error.msg)))
      return res.status(400).send({ validationErrors: validationErrors })
    }

    await UserService.save({ ...req.body })
    return res.status(200).json({
      message: req.t('user_create_success'),
      status: 200
    })
  }
}

module.exports = new UserController()
