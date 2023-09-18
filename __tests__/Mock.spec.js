const MathController = require('../mocks/mathController')
const MathService = require('../mocks/mathService')
const { runCallback } = require('../mocks/utils')

// mock tất cả các function trong 1 module
// jest.mock('../mocks/mathService.js')

describe('test runCallback function', () => {
  //*** */ Ý Tưởng:
  // 1. tạo 1 function test
  // 2. call đến function (runCallback) đang gọi function muốn test (callback)
  // ở đây muốn test callback có được gọi không thông qua input truyền vào function runCallback
  // 3. lúc này callbackMock là đại diện cho callback cần truyền vào

  // tạo 1 function test
  const callbackMock = jest.fn()

  // test 1
  test('Should run callback with input < 100', async () => {
    runCallback(19, callbackMock)

    expect(callbackMock).toBeCalled() // với input là 19 => xNumber < 100 ==> callback phải được gọi
    expect(callbackMock).toBeCalledTimes(1) // số lần callback được gọi là 1
    expect(callbackMock).toBeCalledWith(95) // callback được gọi với giá trị truyền vào là 95
  })

  // test 2
  test('Should not run callback with input > 100', () => {
    runCallback(20, callbackMock)

    expect(callbackMock).not.toBeCalled() // với input là 20 => xNumber = 100 ==> calback phải không được gọi
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // clearAllMocks sau mỗi lần test
  // bởi vì ở test1 thì callbackMock đã được gọi. CHO NÊN LÀ
  // ở test2 mặc dù callbackMock không chạy thật vì input > 100
  // NHƯNG do test1 đã gọi nên nó tính là đã gọi =>  .not.toBeCalled sai
  // nên cần phải clearAllMocks sau mỗi lần test function
})

// describe('Mock 1 function với jest.fn', () => {
//   MathService.add = jest.fn()
//   MathService.subtract = jest.fn()

//   test('Test MathService.add', () => {
//     MathController.doAdd(5, 6)

//     expect(MathService.add).toHaveBeenCalledWith(5, 6)
//   })

//   test('Test MathService.subtract', () => {
//     MathController.doSubtract(3, 2)

//     expect(MathService.subtract).toHaveBeenCalledWith(3, 2)
//   })
// })

// beforeEach(() => {
//   // Clear all instances and calls to constructor and all methods:
//   //   MathService.add.mockClear()
//   MathService.mockClear()
// })
afterEach(() => jest.resetAllMocks())
// describe('Mock 1 module với jest.mock', () => {
//   // thay vì gán từng funtion trong 1 module bằng jest.fn()
//   // thì dùng jest.mock sẽ gán tất cả function trong 1 module bằng jest.fn()

//   test('test MathService.multiply', () => {
//     MathController.doMultiply(2, 3)
//     expect(MathService.multiply).toHaveBeenCalledWith(2, 3)
//   })

//   test('test MathService.add', () => {
//     MathController.doAdd(1, 2)
//     expect(MathService.add).toBeCalledTimes(1)
//   })

//   test('test MathService.divide', () => {
//     MathController.doDivide(2, 3)
//     expect(MathService.divide).toHaveBeenCalledWith(2, 3)
//   })
// })

describe('Spy or mock 1 function với jest.spyOn', () => {
  // jest.spyOn: giữ nguyên original implementation có nghĩa là gọi tới function đó vẫn trả về kết quả
  // còn dùng mock() và fn() thì return về undefined

  test('Test original implementation', () => {
    const addMock = jest.spyOn(MathService, 'add')
    // call the original implementation
    const response = MathController.doAdd(1, 2)
    expect(response).toEqual(3)

    // and the spy stores the calls to add
    expect(addMock).toHaveBeenCalledWith(1, 2)
  })

  test('Testing override the implementation', () => {
    const addMock = jest.spyOn(MathService, 'add')
    // override the implementation
    // addMock.mockImplementation(() => 'mock')
    // expect(MathController.doAdd(1, 2)).toEqual('mock')
    // restore the original implementation
    // addMock.mockRestore();
    // expect(MathController.doAdd(1, 2)).toEqual(3);
  })
})
