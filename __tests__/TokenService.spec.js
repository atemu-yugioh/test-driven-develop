const sequelize = require('../src/config/database')

const tokenModel = require('../src/auth/tokenModel')
const TokenService = require('../src/auth/TokenService')

beforeAll(async () => {
  await sequelize.sync()
})

beforeEach(async () => {
  await tokenModel.destroy({ truncate: { cascade: true } })
})

describe('Scheduled Token Cleanup', () => {
  it('clears the expired token with scheduled task', async () => {
    jest.useFakeTimers()
    const token = 'test-token'
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
    await tokenModel.create({
      token: token,
      lastUsedAt: eightDaysAgo
    })

    TokenService.scheduleCleanup()
    jest.advanceTimersByTime(2000)
    const tokenInDB = await tokenModel.findOne({ where: { token: token } })
    expect(tokenInDB).toBeNull()
  })
})
