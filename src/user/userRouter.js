const express = require('express')
const router = express.Router()
const userController = require('./userController')
const asyncHandler = require('../helper/asyncHandler')

const { check } = require('express-validator')

router.post(
  '',
  check('username').notEmpty().withMessage('Username cannot be null'),
  check('email').notEmpty().withMessage('Email cannot be null'),
  check('password').notEmpty().withMessage('Password cannot be null'),
  asyncHandler(userController.register)
)

module.exports = router
