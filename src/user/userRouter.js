const express = require('express')
const router = express.Router()
const userController = require('./userController')
const asyncHandler = require('../helper/asyncHandler')

const validateUsername = (req, res, next) => {
  const { username } = req.body

  if (!username) {
    req.validationErrors = {
      username: 'Username cannot be null'
    }
  }

  next()
}

const validateEmail = (req, res, next) => {
  const { email } = req.body

  if (!email) {
    req.validationErrors = {
      ...req.validationErrors,
      email: 'Email cannot be null'
    }
  }

  next()
}

router.post('', validateUsername, validateEmail, asyncHandler(userController.register))

module.exports = router
