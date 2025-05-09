// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    // 验证管理员权限
    const user = await db.collection('users').where({
      openid: wxContext.OPENID
    }).get()
    
    if (!user.data[0] || !user.data[0].isAdmin) {
      return {
        code: 403,
        message: '无权限操作'
      }
    }
    
    // 获取待审核订单数
    const pendingCount = await db.collection('bookings').where({
      status: 'pending'
    }).count()
    
    // 获取已通过订单数
    const approvedCount = await db.collection('bookings').where({
      status: 'approved'
    }).count()
    
    // 获取已完成订单数
    const completedCount = await db.collection('bookings').where({
      status: 'completed'
    }).count()
    
    return {
      code: 0,
      data: {
        pendingCount: pendingCount.total,
        approvedCount: approvedCount.total,
        completedCount: completedCount.total
      }
    }
  } catch (err) {
    console.error(err)
    return {
      code: 500,
      message: '服务器错误',
      error: err.message
    }
  }
}