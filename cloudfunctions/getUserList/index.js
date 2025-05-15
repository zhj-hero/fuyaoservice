// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const userCollection = db.collection('users')

// 云函数入口函数
exports.main = async (event, context) => {
    // 获取WX Context (微信调用上下文)
    const wxContext = cloud.getWXContext()

    try {
        // 检查是否是管理员
        const adminCheck = await db.collection('users').where({
            openid: wxContext.OPENID,
            isAdmin: true
        }).get()

        // 如果不是管理员，拒绝访问
        if (adminCheck.data.length === 0) {
            return {
                code: 403,
                message: '权限不足，仅管理员可访问'
            }
        }

        // 获取用户列表
        const users = await userCollection.get()

        return {
            code: 0,
            data: users.data,
            message: '获取用户列表成功'
        }
    } catch (err) {
        console.error('获取用户列表失败', err)
        return {
            code: 500,
            message: '获取用户列表失败: ' + err.message
        }
    }
}