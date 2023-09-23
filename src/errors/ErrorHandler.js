const errorHandler = (error, req, res, next) => {
  const { status, message, errors } = error

  let validationErrors

  if (errors) {
    validationErrors = {}
    errors.forEach((error) => (validationErrors[error.path] = req.t(error.msg)))
  }

  return res.status(status).json({
    message: req.t(message),
    status,
    validationErrors
  })
}

module.exports = errorHandler
