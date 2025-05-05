// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
    const { seatId, startDate, endDate, remark, name, phone } = event
    const wxContext = cloud.getWXContext()

    if (!seatId || !startDate || !endDate || !name || !phone) {
        return {
            code: 1,
            message: '参数不完整'
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
    const overlap = await db.collection('bookings')
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
    const booking = {
        seatId,
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
        await db.collection('bookings').add({ data: booking })
        
        // // 发送订阅消息给管理员
        // await cloud.openapi.subscribeMessage.send({
        //     touser: '管理员OPENID', // 需要替换为实际管理员OPENID
        //     templateId: '订阅消息模板ID', // 需要替换为实际模板ID
        //     page: 'pages/admin/reservation-review/reservation-review',
        //     data: {
        //         thing1: { value: seat.name },
        //         time2: { value: startDate + '至' + endDate },
        //         thing3: { value: '新预约待审核' }
        //     }
        // })
        
        return {
            code: 0,
            message: '预约申请已提交，等待管理员审核'
        }
    } catch (e) {
        return {
            code: 5,
            message: '预约提交失败',
            error: e.message
        }
    }
}