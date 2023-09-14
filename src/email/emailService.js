const transporter = require('../config/emailTransporter')

class EmailService {
  static sendAccountActivation = async (email, token) => {
    await transporter.sendMail({
      from: 'My App <info@my-app.com>',
      to: email,
      subject: 'Account Activation',
      html: `Token is ${token}`
    })
  }
}

module.exports = EmailService
