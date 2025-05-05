// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
    // 参数校验
    if (!event.seatId) {
        return {
            code: 1,
            message: '缺少座位ID参数'
        }
    }

    try {
        // 检查座位是否存在
        const seatCheck = await db.collection('seats').doc(event.seatId).get()
        if (!seatCheck.data) {
            return {
                code: 1,
                message: '座位不存在'
            }
        }

        // 检查座位是否有未完成的预约
        const bookingCheck = await db.collection('bookings')
            .where({
                seatId: event.seatId,
                status: _.in(['pending', 'approved', 'using'])
            })
            .count()

        if (bookingCheck.total > 0) {
            return {
                code: 1,
                message: '该座位有未完成的预约，无法删除'
            }
        }

        // 删除座位
        await db.collection('seats').doc(event.seatId).remove()

        return {
            code: 0,
            message: '删除座位成功'
        }
    } catch (err) {
        console.error('删除座位失败', err)
        return {
            code: 1,
            message: '删除座位失败: ' + err.message
        }
    }
}