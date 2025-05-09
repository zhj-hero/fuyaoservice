// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
    const { seatId, seatNumber, startDate, endDate, remark, name, phone } = event
    const wxContext = cloud.getWXContext()

    if (!seatId || !startDate || !endDate || !name || !phone) {
        return {
            code: 1,
            message: '参数不完整'
        }
    }

    // 检查用户是否有待审核的预订
    const pendingRes = await db.collection('reservations').where({
        userId: wxContext.OPENID,
        status: 'pending'
    }).get()
    if (pendingRes.data && pendingRes.data.length > 0) {
        return {
            code: 6,
            message: '您已有待审核的预订，请等待审核完成后再预订'
        }
    }

    // 获取座位信息并校验状态
    const seatRes = await db.collection('seats').doc(seatId).get().catch(() => null)
    if (!seatRes || !seatRes.data) {
        return {
            code: 2,
            message: '座位不存在'
        }
    }
    const seat = seatRes.data
    if (seat.status !== 'available') {
        return {
            code: 3,
            message: '座位已被占用'
        }
    }

    // 并发控制：再次检查该时间段是否已被预订
    const overlap = await db.collection('reservations')
        .where({
            seatId,
            $or: [
                { startDate: db.command.lte(endDate), endDate: db.command.gte(startDate) }
            ]
        })
        .get()
    if (overlap.data && overlap.data.length > 0) {
        return {
            code: 4,
            message: '该时间段已被预订'
        }
    }

    // 写入预约信息
    const reservation = {
        seatId,
        seatNumber: seatNumber || seat.number, // 使用传入的座位号或从座位信息中获取
        userId: wxContext.OPENID,
        userName: wxContext.NAME,
        seatType: seat.type,
        startDate,
        endDate,
        remark: remark || '',
        name,
        phone,
        createTime: db.serverDate(),
        status: 'pending'
    }

    try {
        // 保存预约记录
        await db.collection('reservations').add({ data: reservation })

        // 更新座位状态为已预订
        await db.collection('seats').doc(seatId).update({
            data: {
                status: 'reserved',
                statusText: '已预订'
            }
        })


        return {
            code: 0,
            message: '预约申请已提交，请联系客服审核'
        }
    } catch (e) {
        return {
            code: 5,
            message: '预约提交失败',
            error: e.message
        }
    }
}