class EmailException {
  constructor(message = 'email_failure') {
    this.message = message
    this.status = 502
  }
}

module.exports = {
  EmailException
}
