// pages/admin/reservation-review/reservation-review.js
const app = getApp()

Page({
    data: {
        reservationList: [],
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

        // 获取待审核预订列表
        this.fetchReservationList()
    },

    // 获取预订列表
    fetchReservationList: function () {
        wx.showLoading({
            title: '加载中...',
        })

        wx.cloud.callFunction({
            name: 'getPendingReservations',
            success: res => {
                wx.hideLoading()
                if (res.result.code === 0) {
                    this.setData({
                        reservationList: res.result.data
                    })
                } else {
                    wx.showToast({
                        title: res.result.message || '获取预订列表失败',
                        icon: 'none'
                    })
                }
            },
            fail: err => {
                wx.hideLoading()
                console.error('获取预订列表失败', err)
                wx.showToast({
                    title: '获取预订列表失败，请稍后再试',
                    icon: 'none'
                })
            }
        })
    },

    // 审核通过
    approveReservation: function (e) {
        const reservationId = e.currentTarget.dataset.id
        wx.showModal({
            title: '确认审核',
            content: '确定要通过此预订申请吗？',
            success: res => {
                if (res.confirm) {
                    wx.showLoading({
                        title: '处理中...',
                    })

                    wx.cloud.callFunction({
                        name: 'approveReservation',
                        data: { reservationId },
                        success: res => {
                            wx.hideLoading()
                            if (res.result.code === 0) {
                                wx.showToast({
                                    title: '审核通过',
                                    icon: 'success'
                                })
                                this.fetchReservationList()
                            } else {
                                wx.showToast({
                                    title: res.result.message || '审核失败',
                                    icon: 'none'
                                })
                            }
                        },
                        fail: err => {
                            wx.hideLoading()
                            console.error('审核失败', err)
                            wx.showToast({
                                title: '审核失败，请稍后再试',
                                icon: 'none'
                            })
                        }
                    })
                }
            }
        })
    },

    // 审核拒绝
    rejectReservation: function (e) {
        const reservationId = e.currentTarget.dataset.id
        wx.showModal({
            title: '确认拒绝',
            content: '确定要拒绝此预订申请吗？',
            success: res => {
                if (res.confirm) {
                    wx.showLoading({
                        title: '处理中...',
                    })

                    wx.cloud.callFunction({
                        name: 'rejectReservation',
                        data: { reservationId },
                        success: res => {
                            wx.hideLoading()
                            if (res.result.code === 0) {
                                wx.showToast({
                                    title: '已拒绝',
                                    icon: 'success'
                                })
                                this.fetchReservationList()
                            } else {
                                wx.showToast({
                                    title: res.result.message || '拒绝失败',
                                    icon: 'none'
                                })
                            }
                        },
                        fail: err => {
                            wx.hideLoading()
                            console.error('拒绝失败', err)
                            wx.showToast({
                                title: '拒绝失败，请稍后再试',
                                icon: 'none'
                            })
                        }
                    })
                }
            }
        })
    }
})