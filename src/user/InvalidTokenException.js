class InvalidTokenException {
  constructor(message = 'account_activation_failure') {
    this.message = message
    this.status = 400
  }
}

module.exports = InvalidTokenException
