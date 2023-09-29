const express = require('express')
const authController = require('./authController')
const asyncHandler = require('../helper/asyncHandler')
const { check } = require('express-validator')

const router = express.Router()

router.post('', check('email').isEmail(), asyncHandler(authController.auth))

module.exports = router
