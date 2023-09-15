const { runCallback } = require('../mocks/utils')

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

  // clearAllMocks sau mỗi lần test
  // bởi vì ở test1 thì callbackMock đã được gọi. CHO NÊN LÀ
  // ở test2 mặc dù callbackMock không chạy thật vì input > 100
  // NHƯNG do test1 đã gọi nên nó tính là đã gọi =>  .not.toBeCalled sai
  // nên cần phải clearAllMocks sau mỗi lần test function
  afterEach(() => {
    jest.clearAllMocks()
  })
})
