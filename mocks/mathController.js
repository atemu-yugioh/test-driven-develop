const MathService = require('./mathService')

class MathController {
  static doAdd = (a, b) => MathService.add(a, b)
  static doSubtract = (a, b) => MathService.subtract(a, b)
  static doMultiply = (a, b) => MathService.multiply(a, b)
  static doDivide = (a, b) => MathService.divide(a, b)
}

module.exports = MathController
