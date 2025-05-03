// 测试获取用户预订云函数
const cloud = require('wx-server-sdk');

// 模拟云函数环境
mock = {
    openid: 'test-openid-123456',
};

// 模拟数据库操作
const mockBookingsData = [
    {
        _id: 'booking-1',
        openid: 'test-openid-123456',
        seatId: 'seat-1',
        createTime: new Date(Date.now() - 1000 * 60) // 1分钟前
    },
    {
        _id: 'booking-2',
        openid: 'test-openid-123456',
        seatId: 'seat-2',
        createTime: new Date(Date.now() - 1000 * 60 * 60) // 1小时前
    },
    {
        _id: 'booking-3',
        openid: 'other-openid-789',
        seatId: 'seat-3',
        createTime: new Date()
    }
];

const mockDB = {
    collection: (collectionName) => {
        if (collectionName === 'bookings') {
            return {
                where: (query) => ({
                    orderBy: (field, direction) => ({
                        get: async () => ({
                            data: mockBookingsData
                                .filter(booking => booking.openid === query.openid)
                                .sort((a, b) => {
                                    // 根据direction排序
                                    return direction === 'desc'
                                        ? b.createTime - a.createTime
                                        : a.createTime - b.createTime;
                                })
                        })
                    })
                })
            };
        }
    }
};

// 模拟云函数环境
cloud.init = () => { };
cloud.getWXContext = () => ({ OPENID: mock.openid });
cloud.database = () => mockDB;

// 导入云函数
const getUserBookings = require('../getUserBookings/index');

// 测试用例
async function runTests() {
    console.log('开始测试获取用户预订云函数...');

    // 测试用例1: 正常获取用户预订
    console.log('\n测试用例1: 正常获取用户预订');
    const result1 = await getUserBookings.main({}, {});
    console.log('返回结果:', JSON.stringify(result1, null, 2));
    console.log('测试结果:',
        result1.code === 0 &&
            result1.data.length === 2 &&
            result1.data[0]._id === 'booking-1' ? '通过' : '失败');

    // 测试用例2: 用户没有预订
    console.log('\n测试用例2: 用户没有预订');
    // 修改模拟openid
    const originalOpenid = mock.openid;
    mock.openid = 'no-booking-user';

    const result2 = await getUserBookings.main({}, {});
    console.log('返回结果:', JSON.stringify(result2, null, 2));
    console.log('测试结果:',
        result2.code === 0 &&
            result2.data.length === 0 ? '通过' : '失败');

    // 恢复模拟openid
    mock.openid = originalOpenid;

    // 测试用例3: 异常情况测试
    console.log('\n测试用例3: 异常情况测试');
    cloud.getWXContext = () => { throw new Error('获取用户信息失败'); };
    const result3 = await getUserBookings.main({}, {});
    console.log('返回结果:', JSON.stringify(result3, null, 2));
    console.log('测试结果:', result3.code === -1 ? '通过' : '失败');

    console.log('\n获取用户预订云函数测试完成');
}

// 运行测试
runTests().catch(console.error);