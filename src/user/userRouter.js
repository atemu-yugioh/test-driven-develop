const express = require('express')
const router = express.Router()
const userService = require('./userService')
const userController = require('./userController')
const asyncHandler = require('../helper/asyncHandler')

router.post('', asyncHandler(userController.register))

module.exports = router
