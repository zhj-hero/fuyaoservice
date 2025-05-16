// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
    const { content } = event
    const wxContext = cloud.getWXContext()

    // 验证用户是否登录
    if (!wxContext.OPENID) {
        return {
            code: 401,
            message: '请先登录'
        }
    }

    // 验证留言内容
    if (!content || content.trim() === '') {
        return {
            code: 400,
            message: '留言内容不能为空'
        }
    }

    try {
        // 输出OPENID用于调试
        console.log('用户OPENID:', wxContext.OPENID)

        // 获取用户信息
        console.log('查询用户条件:', { openid: wxContext.OPENID })
        const userRes = await db.collection('users').where({
            openid: wxContext.OPENID
        }).get()
        console.log('用户查询结果:', userRes)

        // 检查当天留言数量
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const countRes = await db.collection('messages').where({
            openid: wxContext.OPENID,
            createTime: db.command.gte(today).and(db.command.lt(tomorrow))
        }).count();

        if (countRes.total >= 3) {
            return {
                code: 429,
                message: '为防止刷屏，我们限制每人每日最多发布3条留言。'
            }
        }

        if (userRes.data.length === 0) {
            return {
                code: 404,
                message: '用户不存在'
            }
        }

        const user = userRes.data[0]
        console.log('用户信息:', user)
        // // 获取微信用户信息作为备用
        // const wxUserInfo = wxContext.userInfo?.user || {}

        // 获取用户信息中的nickName和avatarUrl
        const userNickName = user.userInfo.nickName  || '匿名用户'
        const userAvatarUrl = user.userInfo.avatarUrl  || ''

        // 添加留言
        const result = await db.collection('messages').add({
            data: {
                content: content,
                createTime: db.serverDate(),
                updateTime: db.serverDate(),
                openid: wxContext.OPENID,
                nickName: userNickName,
                avatarUrl: userAvatarUrl,
                comments: [],
                isDeleted: false
            }
        })

        return {
            code: 0,
            message: '留言成功',
            data: {
                id: result._id
            }
        }
    } catch (err) {
        console.error('添加留言失败', err)
        return {
            code: 500,
            message: '添加留言失败'
        }
    }
}