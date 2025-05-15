// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
    // 参数校验
    if (!event.userId) {
        return {
            code: 1,
            message: '用户ID不能为空'
        }
    }

    try {
        // 准备更新的数据
        const updateData = {}

        // 只更新提供的字段
        if (event.name !== undefined) {
            updateData.name = event.name
        }

        if (event.phone !== undefined) {
            updateData.phone = event.phone
        }

        if (event.isAdmin !== undefined) {
            updateData.isAdmin = event.isAdmin
        }

        // 更新用户信息
        const result = await db.collection('users').doc(event.userId).update({
            data: updateData
        })

        return {
            code: 0,
            message: '更新成功',
            data: result
        }
    } catch (err) {
        console.error('更新用户信息失败', err)
        return {
            code: 1,
            message: '更新用户信息失败: ' + err.message,
            error: err
        }
    }
}