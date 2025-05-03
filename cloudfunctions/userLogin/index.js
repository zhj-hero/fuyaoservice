// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
    try {
        // 获取用户信息
        const { userInfo } = event

        // 获取openid
        const wxContext = cloud.getWXContext()
        const openid = wxContext.OPENID

        // 连接数据库
        const db = cloud.database()

        // 查询用户是否已存在
        const userCollection = db.collection('users')
        let user = await userCollection.where({
            openid: openid
        }).get()

        // 如果用户不存在，则创建新用户
        if (user.data.length === 0) {
            await userCollection.add({
                data: {
                    openid: openid,
                    userInfo: userInfo,
                    createTime: db.serverDate()
                }
            })

            user = await userCollection.where({
                openid: openid
            }).get()
        }

        // 返回成功结果
        return {
            code: 0,
            data: {
                token: openid, // 使用openid作为token
                userInfo: user.data[0]
            },
            message: '登录成功'
        }
    } catch (err) {
        // 返回错误信息
        return {
            code: -1,
            message: err.message || '登录失败'
        }
    }
}