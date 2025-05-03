// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
    try {
        // 获取座位ID
        const { seatId } = event

        // 连接数据库
        const db = cloud.database()

        // 查询座位信息
        const seatsCollection = db.collection('seats')
        const seat = await seatsCollection.doc(seatId).get()

        // 返回成功结果
        return {
            code: 0,
            data: seat.data,
            message: '获取座位信息成功'
        }
    } catch (err) {
        // 返回错误信息
        return {
            code: -1,
            message: err.message || '获取座位信息失败'
        }
    }
}