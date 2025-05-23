// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext()

    try {
        // 查询用户信息，判断是否为管理员
        const userRes = await db.collection('users').where({
            _openid: wxContext.OPENID
        }).get()

        const isAdmin = userRes.data.length > 0 && userRes.data[0].isAdmin

        // 查询所有留言列表，按时间倒序排列
        const messagesRes = await db.collection('messages')
            .orderBy('createTime', 'desc')
            .get()

        return {
            code: 0,
            message: '获取留言列表成功',
            data: {
                list: messagesRes.data,
                isAdmin: isAdmin
            }
        }
    } catch (err) {
        console.error('获取留言列表失败', err)
        return {
            code: 500,
            message: '获取留言列表失败'
        }
    }
}