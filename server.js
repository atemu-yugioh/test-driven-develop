const app = require('./src/app')
const TokenService = require('./src/auth/TokenService')
const sequelize = require('./src/config/database')
const UserModel = require('./src/user/userModel')
const bcrypt = require('bcrypt')

const addUsers = async (activeUserCount, inactiveUserCount = 0) => {
  const hash = await bcrypt.hash('Password1', 10)
  for (let i = 1; i <= activeUserCount + inactiveUserCount; i++) {
    await UserModel.create({
      username: `user${i + 1}`,
      email: `user${i + 1}@mail.com`,
      inactive: i > activeUserCount,
      password: hash
    })
  }
}

TokenService.scheduleCleanup()

sequelize.sync({ force: true }).then(async () => {
  await addUsers(11)
})

app.listen(3000, () => {
  console.log('app is running')
})
