// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event) => {
    try {
        // 获取预订ID
        const { bookingId } = event

        // 获取openid
        const wxContext = cloud.getWXContext()
        const openid = wxContext.OPENID

        // 连接数据库
        const db = cloud.database()

        // 查询预订信息
        const bookingsCollection = db.collection('bookings')
        const booking = await bookingsCollection.doc(bookingId).get()

        // 验证预订是否属于当前用户
        if (booking.data.userId !== openid) {
            return {
                code: -1,
                message: '无权取消此预订'
            }
        }

        // 更新预订状态为已取消
        await bookingsCollection.doc(bookingId).update({
            data: {
                status: 'cancelled'
            }
        })

        // 更新座位状态为可用
        // const seatsCollection = db.collection('seats')
        await db.collection('seats').doc(booking.data.seatId).update({
            data: {
                status: 'available'
            }
        })

        // 返回成功结果
        return {
            code: 0,
            message: '取消预订成功'
        }
    } catch (err) {
        // 返回错误信息
        return {
            code: -1,
            message: err.message || '取消预订失败'
        }
    }
}