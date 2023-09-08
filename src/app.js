const { error } = require('console')
const express = require('express')
const app = express()

app.use(express.json())

app.use('/api/v1', require('./routes'))
// handle error 404
app.use((req, res, next) => {
  const error = new Error('Not Found')
  error.status = 404
  return next(error)
})

// handle error
app.use((error, req, res, next) => {
  const statusCode = error.status || 500
  return res.status(statusCode).json({
    message: error.message || 'Internal Server Error!!!',
    status: statusCode,
    data: null
  })
})

module.exports = app
