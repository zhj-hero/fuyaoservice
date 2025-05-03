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
        let user
        try {
            user = await userCollection.where({
                openid: openid
            }).get()
        } catch (queryErr) {
            console.error('查询用户失败', queryErr)
            throw new Error('数据库查询失败')
        }

        // 如果用户不存在，则创建新用户
        if (user.data.length === 0) {
            try {
                // 创建新用户
                const newUser = await userCollection.add({
                    data: {
                        openid: openid,
                        userInfo: userInfo,
                        createTime: db.serverDate(),
                        isAdmin: false
                    }
                })

                // 获取新增的用户数据
                user = await userCollection.where({
                    openid: openid
                }).get()

                if (user.data.length === 0) {
                    console.error('创建用户后查询失败')
                    throw new Error('用户创建异常')
                }
            } catch (addErr) {
                console.error('创建用户失败', addErr)
                throw new Error('数据库写入失败')
            }
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
        console.error('微信登录云函数异常', err)
        return {
            code: -1,
            message: err.message || '登录失败'
        }
    }
}