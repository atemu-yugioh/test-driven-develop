# test-driven-develop nodejs

# flow TDD

1. write a test for the expected behavior
2. write the code for that test to pass
3. refactor code: cleanup your code

# run front end

npx http-server -c-1 -p 8080 -P http://localhost:3000

# git hub page hash commit source

https://github.com/basarbk/tdd-nodejs/commits/main?after=a276295e6275c5301203eb7091b64d13fae70675+69&branch=main&qualified_name=refs%2Fheads%2Fmain

# config and setup environment

1. config
   - tên file .json (dev.json) phải trùng với tên môi trường set cho app (NODE_ENV=dev)
   - khi start thì set environment là: dev
   - khi test thì set environment là: test
   - khi ở staging thì environment là: staging
   - khi ở production thì environment là: production
     `Dựa vào environment này mà khi server start sẽ dùng các config tương ứng`
2. cross-env (dùng cho devDependencies): setup multi environment

# i18next

1. req.t(key)

- dùng middlewarw: app.use(middleware.handle(i18next)) để assign translation cho request (req.t)
- translate 1 key sang 1 text tương ứng với folder trong locales
- đa ngôn ngữ được gửi kèm theo header: 'accept-language'
- dựa vào lookupHeader: 'accept-language' mà sẽ truy xuất vào folder locales phù hợp để translate
