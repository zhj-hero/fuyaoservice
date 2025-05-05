// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
    try {
        // 获取座位ID
        const { seatId } = event

        // 验证座位ID格式
        if (!seatId || typeof seatId !== 'string') {
            console.error('无效的座位ID:', seatId)
            return {
                code: -1,
                message: '座位ID不能为空且必须为字符串类型'
            }
        }
        
        // 检查座位ID格式是否符合预期
        if (!/^[A-Za-z0-9]+$/.test(seatId)) {
            console.error('座位ID格式不正确:', seatId)
            return {
                code: -1,
                message: '座位ID格式不正确，只能包含字母和数字'
            }
        }

        // 连接数据库
        const db = cloud.database()

        // 查询座位信息
        const seatsCollection = db.collection('seats')
        console.log('正在查询座位，ID:', seatId)
        const seat = await seatsCollection.doc(seatId).get()

        // 检查座位是否存在
        if (!seat.data) {
            console.error('座位不存在，ID:', seatId, '查询结果:', seat)
            // 检查数据库中是否有类似记录
            const similarSeats = await seatsCollection.where({
                seatNumber: seatId
            }).get()
            
            if (similarSeats.data && similarSeats.data.length > 0) {
                console.log('找到相似座位记录:', similarSeats.data)
                return {
                    code: -1,
                    message: `座位ID ${seatId} 不存在，但找到相似座位号: ${similarSeats.data.map(s => s.seatNumber).join(', ')}`
                }
            }
            
            return {
                code: -1,
                message: `座位ID ${seatId} 不存在`
            }
        }

        // 返回成功结果
        return {
            code: 0,
            data: seat.data,
            message: '获取座位信息成功'
        }
    } catch (err) {
        console.error('获取座位信息失败:', err)
        // 返回错误信息
        return {
            code: -1,
            message: err.message || '获取座位信息失败'
        }
    }
}