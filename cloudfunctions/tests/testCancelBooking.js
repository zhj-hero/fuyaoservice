// 测试取消预订云函数
const cloud = require('wx-server-sdk');

// 模拟云函数环境
mock = {
    openid: 'test-openid-123456',
};

// 模拟数据库操作
let mockBookingsData = [
    {
        _id: 'booking-1',
        openid: 'test-openid-123456',
        seatId: 'seat-1',
        createTime: new Date()
    },
    {
        _id: 'booking-2',
        openid: 'test-openid-123456',
        seatId: 'seat-2',
        createTime: new Date()
    },
    {
        _id: 'booking-3',
        openid: 'other-openid-789',
        seatId: 'seat-3',
        createTime: new Date()
    }
];

let mockSeatsData = [
    { _id: 'seat-1', status: 'occupied' },
    { _id: 'seat-2', status: 'occupied' },
    { _id: 'seat-3', status: 'occupied' }
];

const mockDB = {
    collection: (collectionName) => {
        if (collectionName === 'bookings') {
            return {
                doc: (id) => ({
                    get: async () => {
                        const booking = mockBookingsData.find(b => b._id === id);
                        if (!booking) throw new Error('预订不存在');
                        return { data: booking };
                    },
                    remove: async () => {
                        mockBookingsData = mockBookingsData.filter(b => b._id !== id);
                        return { stats: { removed: 1 } };
                    }
                })
            };
        } else if (collectionName === 'seats') {
            return {
                doc: (id) => ({
                    update: async ({ data }) => {
                        const seatIndex = mockSeatsData.findIndex(s => s._id === id);
                        if (seatIndex !== -1) {
                            mockSeatsData[seatIndex] = { ...mockSeatsData[seatIndex], ...data };
                        }
                        return { stats: { updated: 1 } };
                    }
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
const cancelBooking = require('../cancelBooking/index');

// 测试用例
async function runTests() {
    console.log('开始测试取消预订云函数...');

    // 测试用例1: 正常取消预订
    console.log('\n测试用例1: 正常取消预订');
    const result1 = await cancelBooking.main({ bookingId: 'booking-1' }, {});
    console.log('返回结果:', JSON.stringify(result1, null, 2));
    console.log('座位状态:', mockSeatsData.find(s => s._id === 'seat-1').status);
    console.log('测试结果:',
        result1.code === 0 &&
            mockSeatsData.find(s => s._id === 'seat-1').status === 'available' &&
            !mockBookingsData.find(b => b._id === 'booking-1') ? '通过' : '失败');

    // 测试用例2: 取消不属于自己的预订
    console.log('\n测试用例2: 取消不属于自己的预订');
    const result2 = await cancelBooking.main({ bookingId: 'booking-3' }, {});
    console.log('返回结果:', JSON.stringify(result2, null, 2));
    console.log('测试结果:', result2.code === -1 ? '通过' : '失败');

    // 测试用例3: 取消不存在的预订
    console.log('\n测试用例3: 取消不存在的预订');
    const result3 = await cancelBooking.main({ bookingId: 'non-existent-booking' }, {});
    console.log('返回结果:', JSON.stringify(result3, null, 2));
    console.log('测试结果:', result3.code === -1 ? '通过' : '失败');

    // 测试用例4: 异常情况测试
    console.log('\n测试用例4: 异常情况测试');
    cloud.getWXContext = () => { throw new Error('获取用户信息失败'); };
    const result4 = await cancelBooking.main({ bookingId: 'booking-2' }, {});
    console.log('返回结果:', JSON.stringify(result4, null, 2));
    console.log('测试结果:', result4.code === -1 ? '通过' : '失败');

    console.log('\n取消预订云函数测试完成');
}

// 运行测试
runTests().catch(console.error);