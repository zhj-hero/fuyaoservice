// 测试获取座位信息云函数
const cloud = require('wx-server-sdk');

// 模拟数据库操作
const mockSeatsData = [
    { _id: 'seat-1', name: '座位A1', status: 'available', location: '一楼' },
    { _id: 'seat-2', name: '座位A2', status: 'occupied', location: '一楼' },
    { _id: 'seat-3', name: '座位B1', status: 'available', location: '二楼' },
];

const mockDB = {
    collection: (collectionName) => {
        if (collectionName === 'seats') {
            return {
                doc: (id) => ({
                    get: async () => {
                        const seat = mockSeatsData.find(s => s._id === id);
                        if (!seat) throw new Error('座位不存在');
                        return { data: seat };
                    }
                })
            };
        }
    }
};

// 模拟云函数环境
cloud.init = () => { };
cloud.database = () => mockDB;

// 导入云函数
const getSeatById = require('../getSeatById/index');

// 测试用例
async function runTests() {
    console.log('开始测试获取座位信息云函数...');

    // 测试用例1: 正常获取座位信息
    console.log('\n测试用例1: 正常获取座位信息');
    const result1 = await getSeatById.main({ seatId: 'seat-1' }, {});
    console.log('返回结果:', JSON.stringify(result1, null, 2));
    console.log('测试结果:',
        result1.code === 0 &&
            result1.data.name === '座位A1' &&
            result1.data.status === 'available' ? '通过' : '失败');

    // 测试用例2: 获取已占用座位
    console.log('\n测试用例2: 获取已占用座位');
    const result2 = await getSeatById.main({ seatId: 'seat-2' }, {});
    console.log('返回结果:', JSON.stringify(result2, null, 2));
    console.log('测试结果:',
        result2.code === 0 &&
            result2.data.status === 'occupied' ? '通过' : '失败');

    // 测试用例3: 获取不存在的座位
    console.log('\n测试用例3: 获取不存在的座位');
    const result3 = await getSeatById.main({ seatId: 'non-existent-seat' }, {});
    console.log('返回结果:', JSON.stringify(result3, null, 2));
    console.log('测试结果:', result3.code === -1 ? '通过' : '失败');

    // 测试用例4: 异常情况测试
    console.log('\n测试用例4: 异常情况测试');
    cloud.database = () => { throw new Error('数据库连接失败'); };
    const result4 = await getSeatById.main({ seatId: 'seat-3' }, {});
    console.log('返回结果:', JSON.stringify(result4, null, 2));
    console.log('测试结果:', result4.code === -1 ? '通过' : '失败');

    console.log('\n获取座位信息云函数测试完成');
}

// 运行测试
runTests().catch(console.error);