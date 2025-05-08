// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    // 检查参数
    if (!event.messageId || !event.commentId) {
        return {
            code: 1,
            message: '参数错误'
        }
    }

    try {
        // 获取留言信息
        const messageRes = await db.collection('messages').doc(event.messageId).get()
        const message = messageRes.data

        if (!message) {
            return {
                code: 1,
                message: '留言不存在'
            }
        }

        // 查找要删除的评论
        const comments = message.comments || []
        const commentIndex = comments.findIndex(c => c._id === event.commentId)

        if (commentIndex === -1) {
            return {
                code: 1,
                message: '评论不存在'
            }
        }

        const comment = comments[commentIndex]

        // 检查权限：只有评论作者或管理员可以删除评论
        const isAdmin = await checkIsAdmin(openid)
        if (comment.openid !== openid && !isAdmin) {
            return {
                code: 1,
                message: '没有权限删除该评论'
            }
        }

        // 删除评论
        comments.splice(commentIndex, 1)

        // 更新留言文档
        await db.collection('messages').doc(event.messageId).update({
            data: {
                comments: comments
            }
        })

        return {
            code: 0,
            message: '删除成功'
        }
    } catch (err) {
        console.error('删除评论失败', err)
        return {
            code: 1,
            message: '删除评论失败：' + err.message
        }
    }
}

// 检查用户是否为管理员
async function checkIsAdmin(openid) {
    try {
        const userRes = await db.collection('users').where({
            openid: openid
        }).get()

        if (userRes.data.length > 0) {
            return userRes.data[0].isAdmin === true
        }
        return false
    } catch (err) {
        console.error('检查管理员权限失败', err)
        return false
    }
}