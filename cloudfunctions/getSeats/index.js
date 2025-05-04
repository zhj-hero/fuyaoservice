// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
    try {
        const db = cloud.database()
        const seats = await db.collection('seats').get()

        return {
            code: 0,
            message: '获取座位成功',
            data: seats.data
        }
    } catch (err) {
        console.error('获取座位失败', err)
        return {
            code: -1,
            message: '获取座位失败',
            data: null
        }
    }
}