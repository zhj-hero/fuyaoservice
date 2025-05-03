// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
    try {
        // 获取用户提交的注册信息
        const { name, phone, password } = event

        // 表单验证
        if (!name || !phone || !password) {
            return {
                code: -1,
                message: '请填写完整信息'
            }
        }

        // 获取openid
        const wxContext = cloud.getWXContext()
        const openid = wxContext.OPENID

        // 连接数据库
        const db = cloud.database()

        // 检查手机号是否已被注册
        const userCollection = db.collection('users')
        const existUser = await userCollection.where({
            phone: phone
        }).get()

        if (existUser.data.length > 0) {
            return {
                code: -1,
                message: '该手机号已被注册'
            }
        }

        // 创建新用户
        const result = await userCollection.add({
            data: {
                openid: openid,
                name: name,
                phone: phone,
                password: password, // 实际应用中应对密码进行加密处理
                createTime: db.serverDate(),
                isAdmin: false // 默认为普通用户
            }
        })

        // 返回成功结果
        return {
            code: 0,
            message: '注册成功'
        }
    } catch (err) {
        // 返回错误信息
        return {
            code: -1,
            message: err.message || '注册失败'
        }
    }
}