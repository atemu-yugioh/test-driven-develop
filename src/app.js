const express = require('express')

const app = express()
const bcrypt = require('bcrypt')

const userModel = require('./user/userModel')

app.use(express.json())

app.post('/api/v1/users', async (req, res, next) => {
  const passwordHash = await bcrypt.hash(req.body.password, 10)
  const newUser = await userModel.create({ ...req.body, password: passwordHash })

  if (newUser) {
    return res.status(200).json({
      message: 'User created',
      status: 200
    })
  }
})

module.exports = app
