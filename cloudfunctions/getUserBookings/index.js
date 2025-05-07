// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
    try {
        // 获取openid
        const wxContext = cloud.getWXContext()
        const openid = wxContext.OPENID

        // 连接数据库
        const db = cloud.database()
        const bookingsCollection = db.collection('bookings')

        // 检查是否是管理员以及是否需要查看所有预订
        // 处理不同类型的布尔值参数（字符串'true'或布尔值true）
        const isAdmin = event.isAdmin === true || event.isAdmin === 'true'
        const viewAllBookings = event.viewAllBookings === true || event.viewAllBookings === 'true'

        // 调试日志：输出原始参数
        console.log('调试信息 - 原始参数:', {
            eventIsAdmin: event.isAdmin,
            eventViewAllBookings: event.viewAllBookings,
            openid: openid
        })

        // 调试日志：输出处理后的参数
        console.log('调试信息 - 处理后的参数:', {
            isAdmin: isAdmin,
            viewAllBookings: viewAllBookings
        })

        // 查询条件：
        // 1. 普通用户只能查看自己的预订
        // 2. 管理员在用户页面只查看自己的预订(viewAllBookings=false)
        // 3. 管理员在管理页面查看所有预订(viewAllBookings=true)
        let query = {}
        if (!isAdmin || !viewAllBookings) {
            query.userId = openid
        }

        // 调试日志：输出最终查询条件
        console.log('调试信息 - 查询条件:', query)

        // 查询用户的预订信息
        const bookings = await bookingsCollection.where(query).orderBy('createTime', 'desc').get()

        // 调试日志：输出查询结果数量
        console.log('调试信息 - 查询结果:', {
            totalCount: bookings.data.length,
            firstFewRecords: bookings.data.slice(0, 3).map(item => ({
                id: item._id,
                userId: item.userId,
                seatNumber: item.seatNumber,
                status: item.status
            }))
        })

        // 返回成功结果
        return {
            code: 0,
            data: bookings.data,
            message: '获取预订信息成功'
        }
    } catch (err) {
        // 返回错误信息
        return {
            code: -1,
            message: err.message || '获取预订信息失败'
        }
    }
}