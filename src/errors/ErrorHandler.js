const errorHandler = (error, req, res, next) => {
  let { status, message, errors } = error

  let validationErrors

  if (errors) {
    validationErrors = {}
    errors.forEach((error) => (validationErrors[error.path] = req.t(error.msg)))
  }

  return res.status(status).json({
    path: req.originalUrl,
    timestamp: new Date().getTime(),
    message: req.t(message),
    validationErrors
  })
}

module.exports = errorHandler
