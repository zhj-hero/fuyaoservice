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

        // 查询用户的预订信息
        const bookingsCollection = db.collection('bookings')
        const bookings = await bookingsCollection.where({
            openid: openid
        }).orderBy('createTime', 'desc').get()

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