class AuthenticationException {
  constructor(message = 'authentication_failure') {
    this.message = message
    this.status = 401
  }
}

module.exports = AuthenticationException
