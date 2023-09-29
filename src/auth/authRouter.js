const express = require('express')
const authController = require('./authController')
const asyncHandler = require('../helper/asyncHandler')

const router = express.Router()

router.post('', asyncHandler(authController.auth))

module.exports = router
