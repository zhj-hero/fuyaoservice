// 测试用户登录云函数
const cloud = require('wx-server-sdk');

// 模拟云函数环境
mock = {
    openid: 'test-openid-123456',
};

// 模拟数据库操作
let mockUserData = [];
const mockDB = {
    collection: () => ({
        where: () => ({
            get: async () => ({ data: mockUserData.filter(user => user.openid === mock.openid) }),
        }),
        add: async ({ data }) => {
            mockUserData.push(data);
            return { _id: 'mock-user-id' };
        },
    }),
    serverDate: () => new Date(),
};

// 模拟云函数环境
cloud.init = () => { };
cloud.getWXContext = () => ({ OPENID: mock.openid });
cloud.database = () => mockDB;

// 导入云函数
const userLogin = require('../userLogin/index');

// 测试用例
async function runTests() {
    console.log('开始测试用户登录云函数...');

    // 测试用例1: 新用户登录
    console.log('\n测试用例1: 新用户登录');
    mockUserData = [];
    const testUserInfo = { nickName: '测试用户', avatarUrl: 'test-avatar-url' };
    const result1 = await userLogin.main({ userInfo: testUserInfo }, {});
    console.log('返回结果:', JSON.stringify(result1, null, 2));
    console.log('测试结果:', result1.code === 0 ? '通过' : '失败');

    // 测试用例2: 已存在用户登录
    console.log('\n测试用例2: 已存在用户登录');
    const testUserInfo2 = { nickName: '已存在用户', avatarUrl: 'existing-avatar-url' };
    const result2 = await userLogin.main({ userInfo: testUserInfo2 }, {});
    console.log('返回结果:', JSON.stringify(result2, null, 2));
    console.log('测试结果:', result2.code === 0 ? '通过' : '失败');

    // 测试用例3: 异常情况测试
    console.log('\n测试用例3: 异常情况测试');
    cloud.getWXContext = () => { throw new Error('获取用户信息失败'); };
    const result3 = await userLogin.main({ userInfo: testUserInfo }, {});
    console.log('返回结果:', JSON.stringify(result3, null, 2));
    console.log('测试结果:', result3.code === -1 ? '通过' : '失败');

    console.log('\n用户登录云函数测试完成');
}

// 运行测试
runTests().catch(console.error);