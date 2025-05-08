// pages/admin/seat-edit/seat-edit.js
const app = getApp()

Page({
    data: {
        seatInfo: null,
        isAdmin: false
    },

    onLoad: function (options) {
        // 检查登录状态和管理员权限
        if (!app.globalData.isLoggedIn || !app.globalData.isAdmin) {
            wx.redirectTo({
                url: '/pages/login/login',
            })
            return
        }

        this.setData({
            isAdmin: app.globalData.isAdmin
        })

        // 获取座位ID参数
        const seatId = options.seatId
        if (!seatId) {
            wx.showToast({
                title: '缺少座位ID参数',
                icon: 'none'
            })
            wx.navigateBack()
            return
        }

        // 获取座位信息
        this.fetchSeatInfo(seatId)
    },

    // 获取座位信息
    fetchSeatInfo: function (seatId) {
        wx.showLoading({
            title: '加载中...',
        })

        wx.cloud.callFunction({
            name: 'getSeatById',
            data: {
                seatId: seatId
            },
            success: res => {
                wx.hideLoading()
                if (res.result.code === 0) {
                    this.setData({
                        seatInfo: res.result.data
                    })
                } else {
                    wx.showToast({
                        title: res.result.message || '获取座位信息失败',
                        icon: 'none'
                    })
                    setTimeout(() => {
                        wx.navigateBack()
                    }, 1500)
                }
            },
            fail: err => {
                wx.hideLoading()
                console.error('获取座位信息失败', err)
                wx.showToast({
                    title: '获取座位信息失败，请稍后再试',
                    icon: 'none'
                })
                setTimeout(() => {
                    wx.navigateBack()
                }, 1500)
            }
        })
    },

    // 座位编号变更处理
    onSeatNumberChange: function(e) {
        this.setData({
            'seatInfo.seatNumber': e.detail.value
        })
    },
    
    // 座位区域变更处理
    onSeatAreaChange: function(e) {
        this.setData({
            'seatInfo.seatArea': e.detail.value
        })
    },
    
    // 座位类型变更处理
    onTypeChange: function(e) {
        const typeIndex = e.detail.value
        const typeArray = ['半沉浸','沉浸桌','侧进式']
        const type = typeArray[typeIndex]
        
        this.setData({
            'seatInfo.type': type
        })
    },

    // 座位状态变更处理
    onStatusChange: function (e) {
        const statusIndex = e.detail.value
        const statusOptions = ['available', 'occupied']
        const status = statusOptions[statusIndex]

        this.setData({
            'seatInfo.status': status
        })
    },

    // 保存修改
    saveSeat: function () {
        const { seatInfo } = this.data
        if (!seatInfo) return

        wx.showLoading({
            title: '保存中...',
        })

        wx.cloud.callFunction({
            name: 'updateSeat',
            data: {
                seatId: seatInfo._id,
                updates: {
                    seatNumber: seatInfo.seatNumber,
                    seatArea: seatInfo.seatArea,
                    type: seatInfo.type,
                    status: seatInfo.status
                }
            },
            success: res => {
                wx.hideLoading()
                if (res.result.code === 0) {
                    wx.showToast({
                        title: '保存成功',
                        icon: 'success'
                    })
                    setTimeout(() => {
                        wx.navigateBack()
                    }, 1500)
                } else {
                    wx.showToast({
                        title: res.result.message || '保存失败',
                        icon: 'none'
                    })
                }
            },
            fail: err => {
                wx.hideLoading()
                console.error('保存座位信息失败', err)
                wx.showToast({
                    title: '保存失败，请稍后再试',
                    icon: 'none'
                })
            }
        })
    }
})