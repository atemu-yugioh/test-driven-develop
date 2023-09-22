const { error } = require('console')
const express = require('express')
const i18next = require('i18next')
const Backend = require('i18next-fs-backend')
const middleware = require('i18next-http-middleware')
const app = express()

// init i18next

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: 'en',
    lng: 'en',
    ns: ['translation'],
    defaultNS: 'translation',
    backend: {
      loadPath: './locales/{{lng}}/{{ns}}.json'
    },
    detection: {
      lookupHeader: 'accept-language'
    }
  })

app.use(middleware.handle(i18next))

// use middleware
app.use(express.json())

// init router
app.use('/api/1.0', require('./routes'))

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
