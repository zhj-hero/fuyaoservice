// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
    const { messageId } = event
    const wxContext = cloud.getWXContext()

    // 验证用户是否登录
    if (!wxContext.OPENID) {
        return {
            code: 401,
            message: '请先登录'
        }
    }

    try {
        // 获取留言信息
        const messageRes = await db.collection('messages').doc(messageId).get()
        if (!messageRes.data) {
            return {
                code: 404,
                message: '留言不存在'
            }
        }

        // 获取用户信息，判断是否为管理员
        const userRes = await db.collection('users').where({
            _openid: wxContext.OPENID
        }).get()

        const isAdmin = userRes.data.length > 0 && userRes.data[0].isAdmin

        // 检查权限：只有留言作者或管理员可以删除留言
        if (messageRes.data._openid !== wxContext.OPENID && !isAdmin) {
            return {
                code: 403,
                message: '无权限操作'
            }
        }

        // 软删除留言（将isDeleted标记为true）
        await db.collection('messages').doc(messageId).update({
            data: {
                isDeleted: true,
                updateTime: db.serverDate()
            }
        })

        return {
            code: 0,
            message: '删除成功'
        }
    } catch (err) {
        console.error('删除留言失败', err)
        return {
            code: 500,
            message: '删除留言失败'
        }
    }
}