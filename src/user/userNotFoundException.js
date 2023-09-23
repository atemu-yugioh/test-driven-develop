class UserNotFoundException {
  constructor(message = 'user_not_found') {
    this.message = message
    this.status = 404
  }
}

module.exports = UserNotFoundException
