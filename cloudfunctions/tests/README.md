# 云函数测试目录

此目录包含用于测试云函数功能的测试文件。每个测试文件对应一个云函数，用于验证云函数的功能是否正常工作。

## 测试文件结构

每个测试文件应包含以下内容：

1. 模拟云函数调用环境
2. 多个测试用例，覆盖正常和异常情况
3. 验证返回结果是否符合预期

## 如何运行测试

在本地环境中，可以使用以下命令运行测试：

```bash
node tests/testUserLogin.js
```

## 测试文件列表

- testUserLogin.js - 测试用户登录功能
- testGetSeatById.js - 测试获取座位信息功能
- testGetSeatStatistics.js - 测试获取座位统计功能
- testCancelBooking.js - 测试取消预订功能
- testGetUserBookings.js - 测试获取用户预订功能