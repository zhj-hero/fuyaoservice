// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
    // 获取用户信息
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    try {
        // 获取分页参数
        const { page = 1, pageSize = 10 } = event

        // 连接数据库
        const db = cloud.database()

        // 查询通知列表
        const noticesCollection = db.collection('notifications')
        const total = await noticesCollection.count()

        // 获取用户信息，判断是否为管理员
        const userRes = await db.collection('users').where({
            openid: openid  // 统一使用openid字段
        }).get()
        
        if (!userRes.data || userRes.data.length === 0) {
            return {
                code: 403,
                message: '用户不存在'
            }
        }
        
        const isAdmin = Boolean(userRes.data[0].isAdmin)  // 确保转换为布尔值

        // 构建查询条件
        let query = noticesCollection.orderBy('createTime', 'desc')
            .skip((page - 1) * pageSize)
            .limit(pageSize)

        // 如果不是管理员，只查询isActive为true的通知
        if (!isAdmin) {
            query = noticesCollection.where({
                isActive: true
            }).orderBy('createTime', 'desc')
                .skip((page - 1) * pageSize)
                .limit(pageSize)
        }

        const notices = await query.get()

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