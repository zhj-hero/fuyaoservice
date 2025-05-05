// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
    try {
        // 获取座位ID和更新数据
        const { seatId, updates } = event

        // 参数验证
        if (!seatId) {
            return {
                code: -1,
                message: '缺少座位ID参数'
            }
        }

        if (!updates || typeof updates !== 'object') {
            return {
                code: -1,
                message: '缺少更新数据或格式不正确'
            }
        }

        // 连接数据库
        const db = cloud.database()

        // 更新座位信息
        const seatsCollection = db.collection('seats')
        await seatsCollection.doc(seatId).update({
            data: updates
        })

        // 返回成功结果
        return {
            code: 0,
            message: '更新座位信息成功'
        }
    } catch (err) {
        console.error('更新座位信息失败', err)
        // 返回错误信息
        return {
            code: -1,
            message: err.message || '更新座位信息失败'
        }
    }
}