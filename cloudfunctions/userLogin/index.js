// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
    try {
        // 获取用户登录凭证
        const { phone, password, userInfo } = event

        // 获取openid
        const wxContext = cloud.getWXContext()
        const openid = wxContext.OPENID

        // 连接数据库
        const db = cloud.database()
        const userCollection = db.collection('users')
        
        // 如果提供了手机号和密码，进行账号密码登录
        if (phone && password) {
            // 查询用户是否存在
            let user = await userCollection.where({
                phone: phone
            }).get()
            
            // 验证用户是否存在
            if (user.data.length === 0) {
                return {
                    code: -1,
                    message: '用户不存在'
                }
            }
            
            // 验证密码是否正确
            if (user.data[0].password !== password) {
                return {
                    code: -1,
                    message: '密码错误'
                }
            }
            
            // 返回成功结果
            return {
                code: 0,
                data: {
                    token: openid,
                    userInfo: user.data[0]
                },
                message: '登录成功'
            }
        }
        
        // 微信登录逻辑（保留原有逻辑）
        // 查询用户是否已存在
        let user = await userCollection.where({
            openid: openid
        }).get()

        // 验证是否提供了userInfo
        if (!userInfo) {
            return {
                code: -1,
                message: '未提供登录信息'
            }
        }
        
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