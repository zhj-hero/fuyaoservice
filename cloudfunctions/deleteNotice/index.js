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
        // 连接数据库
        const db = cloud.database()

        // 验证管理员权限
        const userInfo = await db.collection('users').where({
            openid: openid
        }).get()

        if (!userInfo.data.length || !userInfo.data[0].isAdmin) {
            return {
                code: 403,
                message: '权限不足，仅管理员可删除通知'
            }
        }

        // 获取通知ID
        const { noticeId } = event
        if (!noticeId) {
            return {
                code: 400,
                message: '通知ID不能为空'
            }
        }

        // 删除通知
        await db.collection('notifications').doc(noticeId).remove()

        // 返回成功结果
        return {
            code: 0,
            message: '删除通知成功'
        }
    } catch (err) {
        // 返回错误信息
        return {
            code: -1,
            message: err.message || '删除通知失败'
        }
    }
}