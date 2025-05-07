// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
    const { messageId, content } = event
    const wxContext = cloud.getWXContext()

    // 验证用户是否登录
    if (!wxContext.OPENID) {
        return {
            code: 401,
            message: '请先登录'
        }
    }

    // 验证评论内容
    if (!content || content.trim() === '') {
        return {
            code: 400,
            message: '评论内容不能为空'
        }
    }

    try {
        // 获取用户信息
        const userRes = await db.collection('users').where({
            openid: wxContext.OPENID
        }).get()

        if (userRes.data.length === 0) {
            return {
                code: 404,
                message: '用户不存在'
            }
        }

        const user = userRes.data[0]

        // 获取留言信息
        const messageRes = await db.collection('messages').doc(messageId).get()
        if (!messageRes.data) {
            return {
                code: 404,
                message: '留言不存在'
            }
        }

        // 添加评论
        const comment = {
            _id: Date.now().toString(), // 生成唯一ID
            content: content,
            createTime: db.serverDate(),
            openid: wxContext.OPENID,
            userName: user.name || '匿名用户',
            avatarUrl: user.avatarUrl || ''
        }

        // 更新留言，添加评论
        await db.collection('messages').doc(messageId).update({
            data: {
                comments: db.command.push(comment),
                updateTime: db.serverDate()
            }
        })

        return {
            code: 0,
            message: '评论成功',
            data: {
                comment: comment
            }
        }
    } catch (err) {
        console.error('添加评论失败', err)
        return {
            code: 500,
            message: '添加评论失败'
        }
    }
}