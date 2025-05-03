// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
    try {
        // 获取分页参数
        const { page = 1, pageSize = 10 } = event

        // 连接数据库
        const db = cloud.database()

        // 查询通知列表
        const noticesCollection = db.collection('notices')
        const total = await noticesCollection.count()
        const notices = await noticesCollection
            .orderBy('createTime', 'desc')
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .get()

        // 返回成功结果
        return {
            code: 0,
            data: {
                list: notices.data,
                total: total.total,
                page: page,
                pageSize: pageSize
            },
            message: '获取通知列表成功'
        }
    } catch (err) {
        // 返回错误信息
        return {
            code: -1,
            message: err.message || '获取通知列表失败'
        }
    }
}