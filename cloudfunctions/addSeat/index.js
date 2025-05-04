// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
    try {
        // 验证必填字段
        if (!event.seatNumber || !event.seatArea) {
            return {
                code: 1,
                message: '请填写完整座位信息'
            }
        }

        // 检查座位号是否已存在
        const checkRes = await db.collection('seats').where({
            seatNumber: event.seatNumber
        }).get()

        if (checkRes.data.length > 0) {
            return {
                code: 2,
                message: '该座位号已存在'
            }
        }

        // 添加座位数据
        const addRes = await db.collection('seats').add({
            data: {
                seatNumber: event.seatNumber,
                seatArea: event.seatArea,
                type: event.type || '半沉浸',
                status: event.status || 'available',
                createTime: db.serverDate()
            }
        })

        return {
            code: 0,
            message: '添加成功',
            data: addRes
        }
    } catch (err) {
        console.error('添加座位失败', err)
        return {
            code: -1,
            message: '添加失败，请稍后再试'
        }
    }
}