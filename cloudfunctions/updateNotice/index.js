// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
    const { id, isActive } = event
    const wxContext = cloud.getWXContext()

    // 验证用户权限
    // const userRes = await db.collection('users').where({
    //     _openid: wxContext.OPENID
    // }).get()

    // // 确保用户存在且是管理员
    // if (userRes.data.length === 0) {
    //     return {
    //         code: 403,
    //         message: '用户不存在'
    //     }
    // }
    
    // // 管理员有权限执行所有操作
    // if (!userRes.data[0].isAdmin) {
    //     return {
    //         code: 403,
    //         message: '无权限操作'
    //     }
    // }

    try {
        // 更新通知状态
        const res = await db.collection('notifications').doc(id).update({
            data: {
                isActive: isActive,
                updateTime: db.serverDate()
            }
        })

        if (res.stats.updated === 0) {
            return {
                code: 404,
                message: '通知不存在'
            }
        }

        return {
            code: 0,
            message: '操作成功'
        }
    } catch (err) {
        console.error('更新通知状态失败', err)
        return {
            code: 500,
            message: '更新通知状态失败'
        }
    }
}