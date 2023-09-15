class EmailException {
  constructor(message = 'email_failure') {
    this.message = message
  }
}

module.exports = {
  EmailException
}
