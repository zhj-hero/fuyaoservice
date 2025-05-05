// pages/admin/seat-manage/seat-manage.js
const app = getApp()

Page({
    data: {
        seatList: [],
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

        // 获取座位列表
        this.fetchSeatList()
    },

    onShow: function () {
        // 每次页面显示时刷新座位列表数据
        if (app.globalData.isLoggedIn && app.globalData.isAdmin) {
            this.fetchSeatList()
        }
    },

    // 获取座位列表
    fetchSeatList: function () {
        wx.showLoading({
            title: '加载中...',
        })

        wx.cloud.callFunction({
            name: 'getSeats',
            success: res => {
                wx.hideLoading()
                if (res.result.code === 0) {
                    this.setData({
                        seatList: res.result.data
                    })
                } else {
                    wx.showToast({
                        title: res.result.message || '获取座位列表失败',
                        icon: 'none'
                    })
                }
            },
            fail: err => {
                wx.hideLoading()
                console.error('获取座位列表失败', err)
                wx.showToast({
                    title: '获取座位列表失败，请稍后再试',
                    icon: 'none'
                })
            }
        })
    },

    // 删除座位
    deleteSeat: function (e) {
        const seatId = e.currentTarget.dataset.id
        wx.showModal({
            title: '确认删除',
            content: '确定要删除这个座位吗？',
            success: res => {
                if (res.confirm) {
                    wx.showLoading({
                        title: '删除中...',
                    })

                    wx.cloud.callFunction({
                        name: 'deleteSeat',
                        data: { seatId },
                        success: res => {
                            wx.hideLoading()
                            if (res.result.code === 0) {
                                wx.showToast({
                                    title: '删除成功',
                                    icon: 'success'
                                })
                                this.fetchSeatList()
                            } else {
                                wx.showToast({
                                    title: res.result.message || '删除失败',
                                    icon: 'none'
                                })
                            }
                        },
                        fail: err => {
                            wx.hideLoading()
                            console.error('删除座位失败', err)
                            wx.showToast({
                                title: '删除失败，请稍后再试',
                                icon: 'none'
                            })
                        }
                    })
                }
            }
        })
    },

    // 编辑座位
    editSeat: function (e) {
        const seatId = e.currentTarget.dataset.id
        wx.navigateTo({
            url: `/pages/admin/seat-edit/seat-edit?seatId=${seatId}`
        })
    },

    // 添加座位
    addSeat: function () {
        wx.navigateTo({
            url: '/pages/admin/seat-add/seat-add'
        })
    }
})