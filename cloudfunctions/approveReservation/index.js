// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

// 云函数入口函数
exports.main = async (event) => {
    const { reservationId, seatId } = event
    const wxContext = cloud.getWXContext()

    if (!reservationId || !seatId) {
        return {
            code: -3,
            message: '参数错误: reservationId和seatId不能为空'
        }
    }

    // 验证ID参数类型
    if (typeof reservationId !== 'string' && typeof reservationId !== 'number') {
        return {
            code: -4,
            message: '参数类型错误: reservationId必须是字符串或数字'
        }
    }

    if (typeof seatId !== 'string' && typeof seatId !== 'number') {
        return {
            code: -4,
            message: '参数类型错误: seatId必须是字符串或数字'
        }
    }

    console.log('获取到的reservationId:', reservationId);
    console.log('获取到的seatId:', seatId);

    try {
        // 验证管理员权限
        const user = await db.collection('users').where({
            openid: wxContext.OPENID
        }).get()
        if (!user.data[0] || !user.data[0].isAdmin) {
            return {
                code: 403,
                message: '无权限操作'
            }
        }

        // 使用事务同时更新预订状态和座位状态
        const transaction = await db.startTransaction()
        
        try {
            // 检查预订记录是否存在
            const reservation = await transaction.collection('reservations').doc(reservationId).get()
            if (!reservation.data) {
                await transaction.rollback()
                throw new Error('预订记录不存在')
            }

            // 检查座位记录是否存在
            const seat = await transaction.collection('seats').doc(seatId).get()
            if (!seat.data) {
                await transaction.rollback()
                throw new Error('座位记录不存在')
            }

            // 更新预订状态为已批准
            const updateReservation = await transaction.collection('reservations').doc(reservationId).update({
                data: {
                    status: 'approved',
                    updatedAt: db.serverDate()
                }
            })

            // 更新座位状态为已占用
            const updateSeat = await transaction.collection('seats').doc(seatId).update({
                data: {
                    status: 'occupied',
                    statusText: '已占用',
                    updatedAt: db.serverDate()
                }
            })
            
            // 提交事务
            await transaction.commit()
            
            console.log('事务提交成功，预订状态和座位状态已更新')
            console.log('预订更新结果:', updateReservation)
            console.log('座位更新结果:', updateSeat)
            
            const result = {
                reservationUpdated: updateReservation.stats.updated,
                seatUpdated: updateSeat.stats.updated
            }

            if (result.reservationUpdated === 0 || result.seatUpdated === 0) {
                return {
                    code: 404,
                    message: '未找到预订记录或座位信息'
                }
            }

            return {
                code: 0,
                message: '审核通过，座位状态已更新'
            }
        } catch (innerErr) {
            // 确保在内部错误时回滚事务
            console.error('事务执行错误，正在回滚:', innerErr)
            await transaction.rollback()
            throw innerErr  // 将错误抛给外层catch处理
        }
    } catch (err) {
        console.error('操作失败:', err)
        if (err.message.includes('不存在')) {
            return {
                code: 404,
                message: err.message
            }
        }
        return {
            code: 500,
            message: '服务器错误'
        }
    }


}