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
                message: '权限不足，仅管理员可删除用户'
            }
        }

        // 检查要删除的用户是否存在
        const userToDelete = await userCollection.doc(event.userId).get()

        // 如果用户不存在
        if (!userToDelete.data) {
            return {
                code: 404,
                message: '用户不存在'
            }
        }

        // 检查要删除的用户是否是管理员
        if (userToDelete.data.isAdmin) {
            return {
                code: 403,
                message: '不能删除管理员账户'
            }
        }

        // 删除用户
        await userCollection.doc(event.userId).remove()

        return {
            code: 0,
            message: '删除用户成功'
        }
    } catch (err) {
        console.error('删除用户失败', err)
        return {
            code: 500,
            message: '删除用户失败: ' + err.message
        }
    }
}