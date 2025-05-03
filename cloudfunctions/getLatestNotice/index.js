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

        // 查询最新通知
        const noticesCollection = db.collection('notices')
        const notices = await noticesCollection
            .orderBy('createTime', 'desc')
            .limit(1)
            .get()

        // 返回成功结果
        return {
            code: 0,
            data: notices.data.length > 0 ? notices.data[0] : null,
            message: '获取最新通知成功'
        }
    } catch (err) {
        // 返回错误信息
        return {
            code: -1,
            message: err.message || '获取最新通知失败'
        }
    }
}