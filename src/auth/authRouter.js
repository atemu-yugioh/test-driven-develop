const express = require('express')
const authController = require('./authController')
const asyncHandler = require('../helper/asyncHandler')
const { check } = require('express-validator')

const router = express.Router()

router.post('/auth', check('email').isEmail(), asyncHandler(authController.auth))
router.post('/logout', asyncHandler(authController.logout))

module.exports = router
