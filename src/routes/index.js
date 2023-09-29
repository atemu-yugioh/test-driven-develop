const express = require('express')
const router = express.Router()

router.use('/users', require('../user/userRouter'))
router.use('/auth', require('../auth/authRouter'))

module.exports = router
