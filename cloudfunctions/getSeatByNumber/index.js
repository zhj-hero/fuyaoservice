// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
    try {
        const { seatNumber } = event

        // 查询座位信息
        const result = await db.collection('seats')
            .where({
                seatNumber: seatNumber
            })
            .get()

        if (result.data.length === 0) {
            return {
                code: 1,
                message: '未找到对应座位信息'
            }
        }

        return {
            code: 0,
            data: result.data[0]
        }
    } catch (err) {
        console.error(err)
        return {
            code: 2,
            message: '查询座位信息失败',
            error: err
        }
    }
}