const express = require('express')
const router = express.Router()
const userController = require('./userController')
const asyncHandler = require('../helper/asyncHandler')

const { check } = require('express-validator')
const UserService = require('./userService')
const pagination = require('../middleware/pagination')

router.post(
  '',
  check('username')
    .notEmpty()
    .withMessage('username_null')
    .bail()
    .isLength({ min: 4, max: 32 })
    .withMessage('username_size'),
  check('email')
    .notEmpty()
    .withMessage('email_null')
    .bail()
    .isEmail()
    .withMessage('email_invalid')
    .bail()
    .custom(async (email) => {
      const user = await UserService.findByEmail(email)

      if (user) {
        throw new Error('email_inuse')
      }
    }),
  check('password')
    .notEmpty()
    .withMessage('password_null')
    .bail()
    .isLength({ min: 6 })
    .withMessage('password_size')
    .bail()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage('password_pattern'),
  asyncHandler(userController.register)
)

router.post('/token/:token', asyncHandler(userController.activeToken))

router.get('', pagination, asyncHandler(userController.getUsers))

router.get('/:id', asyncHandler(userController.getUser))

router.patch('/:id', asyncHandler(userController.update))

module.exports = router
