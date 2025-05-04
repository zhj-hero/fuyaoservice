// pages/admin/seat-add/seat-add.js
const app = getApp()

Page({
    data: {
        seatInfo: {
            seatNumber: '',
            seatArea: '',
            type: '半沉浸',
            status: 'available'
        },
        isAdmin: false
    },

    onLoad: function () {
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
    },

    // 输入框变化
    onInputChange: function (e) {
        const { field } = e.currentTarget.dataset
        const value = e.detail.value

        this.setData({
            [`seatInfo.${field}`]: value
        })
    },

    // 类型选择变化
    onTypeChange: function (e) {
        const value = e.detail.value
        const typeMap = {
            '0': '半沉浸',
            '1': '沉浸桌',
            '2': '侧进式'
        }
        this.setData({
            'seatInfo.type': typeMap[value] || value
        })
    },

    // 添加座位
    addSeat: function () {
        const { seatInfo } = this.data

        // 验证必填字段
        if (!seatInfo.seatNumber || !seatInfo.seatArea) {
            wx.showToast({
                title: '请填写完整座位信息',
                icon: 'none'
            })
            return
        }

        wx.showLoading({
            title: '添加中...',
        })

        wx.cloud.callFunction({
            name: 'addSeat',
            data: seatInfo,
            success: res => {
                wx.hideLoading()
                if (res.result.code === 0) {
                    wx.showToast({
                        title: '添加成功',
                        icon: 'success'
                    })
                    setTimeout(() => {
                        wx.navigateBack()
                    }, 1500)
                } else {
                    wx.showToast({
                        title: res.result.message || '添加失败',
                        icon: 'none'
                    })
                }
            },
            fail: err => {
                wx.hideLoading()
                console.error('添加座位失败', err)
                wx.showToast({
                    title: '添加失败，请稍后再试',
                    icon: 'none'
                })
            }
        })
    }
})