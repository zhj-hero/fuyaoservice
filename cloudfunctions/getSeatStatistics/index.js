// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
    try {
        // 连接数据库
        const db = cloud.database()
        const _ = db.command

        // 查询座位总数
        const seatsCollection = db.collection('seats')
        const totalSeats = await seatsCollection.count()

        // 查询已占用座位数
        const occupiedSeats = await seatsCollection.where({
            status: 'occupied'
        }).count()

        // 查询可用座位数
        const availableSeats = await seatsCollection.where({
            status: 'available'
        }).count()



        // 返回成功结果
        return {
            code: 0,
            data: {
                totalSeats: totalSeats.total,
                occupiedSeats: occupiedSeats.total,
                availableSeats: availableSeats.total,
            },
            message: '获取座位统计成功'
        }
    } catch (err) {
        // 返回错误信息
        return {
            code: -1,
            message: err.message || '获取座位统计失败'
        }
    }
}