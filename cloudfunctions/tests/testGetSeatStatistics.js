// 测试获取座位统计云函数
const cloud = require('wx-server-sdk');

// 模拟云函数环境

// 模拟数据库操作
const mockSeatsData = [
    { _id: 'seat-1', status: 'available' },
    { _id: 'seat-2', status: 'available' },
    { _id: 'seat-3', status: 'occupied' },
    { _id: 'seat-4', status: 'occupied' },
    { _id: 'seat-5', status: 'occupied' },
];

const mockBookingsData = [
    { _id: 'booking-1', createTime: new Date() },
    { _id: 'booking-2', createTime: new Date() },
    { _id: 'booking-3', createTime: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // 昨天的预订
];

const mockDB = {
    collection: (collectionName) => {
        if (collectionName === 'seats') {
            return {
                count: async () => ({ total: mockSeatsData.length }),
                where: (query) => ({
                    count: async () => ({
                        total: mockSeatsData.filter(seat => seat.status === query.status).length
                    })
                })
            };
        } else if (collectionName === 'bookings') {
            return {
                where: (query) => {
                    // 简单模拟大于等于今天的查询
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return {
                        count: async () => ({
                            total: mockBookingsData.filter(booking => booking.createTime >= today).length
                        })
                    };
                }
            };
        }
    },
    command: {
        gte: (date) => ({ $gte: date })
    }
};

// 模拟云函数环境
cloud.init = () => { };
cloud.database = () => mockDB;

// 导入云函数
const getSeatStatistics = require('../getSeatStatistics/index');

// 测试用例
async function runTests() {
    console.log('开始测试获取座位统计云函数...');

    // 测试用例1: 正常获取座位统计
    console.log('\n测试用例1: 正常获取座位统计');
    const result1 = await getSeatStatistics.main({}, {});
    console.log('返回结果:', JSON.stringify(result1, null, 2));
    console.log('测试结果:',
        result1.code === 0 &&
            result1.data.totalSeats === 5 &&
            result1.data.occupiedSeats === 3 &&
            result1.data.availableSeats === 2 &&
            result1.data.todayBookings === 2 &&
            result1.data.occupancyRate === '60.00%' ? '通过' : '失败');

    // 测试用例2: 无座位数据
    console.log('\n测试用例2: 无座位数据');
    // 修改模拟数据
    const originalSeatsData = [...mockSeatsData];
    mockSeatsData.length = 0;

    const result2 = await getSeatStatistics.main({}, {});
    console.log('返回结果:', JSON.stringify(result2, null, 2));
    console.log('测试结果:',
        result2.code === 0 &&
            result2.data.totalSeats === 0 &&
            result2.data.occupancyRate === '0%' ? '通过' : '失败');

    // 恢复模拟数据
    mockSeatsData.push(...originalSeatsData);

    // 测试用例3: 异常情况测试
    console.log('\n测试用例3: 异常情况测试');
    cloud.database = () => { throw new Error('数据库连接失败'); };
    const result3 = await getSeatStatistics.main({}, {});
    console.log('返回结果:', JSON.stringify(result3, null, 2));
    console.log('测试结果:', result3.code === -1 ? '通过' : '失败');

    console.log('\n获取座位统计云函数测试完成');
}

// 运行测试
runTests().catch(console.error);