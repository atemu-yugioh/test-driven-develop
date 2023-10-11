const express = require('express')
const tokenAuthentication = require('../middleware/tokenAuthentication')
const router = express.Router()

router.use(tokenAuthentication)

router.use('/users', require('../user/userRouter'))
router.use('', require('../auth/authRouter'))

module.exports = router
