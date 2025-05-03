// 云函数入口文件
const cloud = require('wx-server-sdk')

// 正确初始化云环境
cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
    const { userInfo } = event
    const { OPENID } = cloud.getWXContext()

    // 记录请求信息
    console.log('收到更新用户信息请求', { OPENID, userInfo })

    try {
        // 先查询用户是否存在
        const userRecord = await db.collection('users').where({
            openid: OPENID
        }).get()

        // 记录查询结果
        console.log('查询用户记录结果', { OPENID, userRecord })

        // 检查用户是否存在
        if (userRecord.data.length === 0) {
            // 用户不存在，尝试使用_openid查询
            const userRecord2 = await db.collection('users').where({
                _openid: OPENID
            }).get()

            console.log('使用_openid查询用户记录结果', { OPENID, userRecord: userRecord2 })

            if (userRecord2.data.length === 0) {
                return {
                    code: -1,
                    message: '用户信息不存在，请重新登录后再试'
                }
            } else {
                // 使用_openid更新用户信息
                await db.collection('users').where({
                    _openid: OPENID
                }).update({
                    data: userInfo
                })

                console.log('使用_openid更新用户信息成功', OPENID, userInfo)
            }
        } else {
            // 用户存在，更新用户信息
            await db.collection('users').where({
                openid: OPENID
            }).update({
                data: userInfo
            })

            console.log('更新用户信息成功', OPENID, userInfo)
        }

        return {
            code: 0,
            message: '更新成功'
        }
    } catch (err) {
        // 增强错误日志，记录更多信息以便调试
        console.error('更新用户信息失败', {
            openid: OPENID,
            userInfo: userInfo,
            error: err
        })

        return {
            code: -1,
            message: '更新用户信息失败: ' + err.message
        }
    }
}