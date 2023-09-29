class ForbiddenException {
  constructor(message = 'inactive_authentication_failure') {
    this.message = message
    this.status = 403
  }
}

module.exports = ForbiddenException
