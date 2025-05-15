// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
    try {
        // 连接数据库
        const db = cloud.database();
        const _ = db.command;
        const $ = db.command.aggregate;
        const currentDate = new Date();

        // 格式化当前日期为字符串 YYYY-MM-DD 格式，用于比较
        const today = currentDate.toISOString().split('T')[0];
        console.log('当前日期:', today);

        // 查询所有状态为已通过(approved)且结束日期早于当前日期的预订
        const reservationsToUpdate = await db.collection('reservations')
            .where({
                status: 'approved',
                endDate: _.lt(today)
            })
            .get();

        console.log('需要更新的预订数量:', reservationsToUpdate.data.length);

        // 如果没有需要更新的预订，直接返回
        if (reservationsToUpdate.data.length === 0) {
            return {
                code: 0,
                message: '没有需要更新的预订',
                updated: 0
            };
        }

        // 批量更新预订状态为已完成(completed)
        const updatePromises = [];
        const seatUpdatePromises = [];

        for (const reservation of reservationsToUpdate.data) {
            // 更新预订状态
            updatePromises.push(
                db.collection('reservations').doc(reservation._id).update({
                    data: {
                        status: 'completed',
                        statusText: '已完成',
                        updatedAt: db.serverDate()
                    }
                })
            );

            // 更新对应座位状态为空闲
            if (reservation.seatId) {
                seatUpdatePromises.push(
                    db.collection('seats').doc(reservation.seatId).update({
                        data: {
                            status: 'available',
                            statusText: '空闲',
                            updatedAt: db.serverDate()
                        }
                    })
                );
            }
        }

        // 执行所有更新操作
        const updateResults = await Promise.all(updatePromises);
        const seatUpdateResults = await Promise.all(seatUpdatePromises);

        // 统计更新结果
        const updatedReservations = updateResults.reduce((total, result) => total + result.stats.updated, 0);
        const updatedSeats = seatUpdateResults.reduce((total, result) => total + result.stats.updated, 0);

        console.log('已更新预订数量:', updatedReservations);
        console.log('已更新座位数量:', updatedSeats);

        return {
            code: 0,
            message: '自动更新预订状态成功',
            updatedReservations,
            updatedSeats
        };
    } catch (err) {
        console.error('自动更新预订状态失败', err);
        return {
            code: -1,
            message: err.message || '自动更新预订状态失败'
        };
    }
};