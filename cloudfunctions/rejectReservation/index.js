// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
    const { reservationId } = event
    const wxContext = cloud.getWXContext()

    try {
        // 验证管理员权限
        const user = await db.collection('users').where({
            openid: wxContext.OPENID
        }).get()
        if (!user.data[0] || !user.data[0].isAdmin) {
            return {
                code: 403,
                message: '无权限操作'
            }
        }

        // 更新预订状态为已拒绝
        const result = await db.collection('bookings').doc(reservationId).update({
            data: {
                status: 'rejected',
                updatedAt: db.serverDate()
            }
        })

        if (result.stats.updated === 0) {
            return {
                code: 404,
                message: '未找到预订记录'
            }
        }

        return {
            code: 0,
            message: '操作成功'
        }
    } catch (err) {
        console.error(err)
        return {
            code: 500,
            message: '服务器错误'
        }
    }
}