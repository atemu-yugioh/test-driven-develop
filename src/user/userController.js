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

    try {
      await UserService.save({ ...req.body })
      return res.status(200).json({
        message: req.t('user_create_success'),
        status: 200
      })
    } catch (err) {
      return res.status(502).send({ message: req.t(err.message) })
    }
  }
}

module.exports = new UserController()
