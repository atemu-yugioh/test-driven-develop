class InvalidTokenException {
  constructor(message = 'account_activation_failure') {
    this.message = message
  }
}

module.exports = InvalidTokenException
