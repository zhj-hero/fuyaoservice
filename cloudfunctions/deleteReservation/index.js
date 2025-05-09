// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
    const { id } = event
    const wxContext = cloud.getWXContext()

    try {
        // 验证管理员权限
        const user = await db.collection('users').where({
            openid: wxContext.OPENID
        }).get()

        if (!user.data[0] || !user.data[0].isAdmin) {
            return {
                code: 403,
                message: '无权限执行此操作'
            }
        }

        // 删除预订记录
        const result = await db.collection('reservations').doc(id).remove()

        return {
            code: 0,
            message: '删除成功',
            data: result
        }
    } catch (err) {
        console.error(err)
        return {
            code: 500,
            message: '删除失败',
            error: err
        }
    }
}