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

    // 删除预订
    deleteReservation: function (e) {
        const id = e.currentTarget.dataset.id;
        wx.showModal({
            title: '确认删除',
            content: '确定要删除这条预订记录吗？',
            success: res => {
                if (res.confirm) {
                    wx.showLoading({
                        title: '删除中...',
                    })
                    wx.cloud.callFunction({
                        name: 'deleteReservation',
                        data: {
                            id: id
                        },
                        success: res => {
                            wx.hideLoading();
                            if (res.result.code === 0) {
                                wx.showToast({
                                    title: '删除成功',
                                    icon: 'success'
                                })
                                this.fetchReservationList();
                            } else {
                                wx.showToast({
                                    title: res.result.message || '删除失败',
                                    icon: 'none'
                                })
                            }
                        },
                        fail: err => {
                            wx.hideLoading();
                            wx.showToast({
                                title: '删除失败',
                                icon: 'none'
                            })
                            console.error(err);
                        }
                    })
                }
            }
        })
    },

    // 获取预订列表
    fetchReservationList: function () {
        wx.showLoading({
            title: '加载中...',
        })

        wx.cloud.callFunction({
            name: 'getUserReservations',
            data: {
                isAdmin: this.data.isAdmin,
                viewAllReserves: true
            },
            success: res => {
                wx.hideLoading()
                // console.log('获取到的预订列表数据:', res.result.data)
                if (res.result.code === 0) {
                    const reservations = res.result.data.map(reserve => {
                        // 处理状态文本
                        let statusText = '未知';
                        switch (reserve.status) {
                            case 'pending':
                                statusText = '待审核';
                                break;
                            case 'approved':
                                statusText = '已通过';
                                break;
                            case 'rejected':
                                statusText = '已拒绝';
                                break;
                            case 'cancelled':
                                statusText = '已取消';
                                break;
                            case'completed':
                                statusText = '已完成';
                                break;
                            default:
                                statusText = reserve.statusText || '未知';
                        }
                        return {
                            ...reserve,
                            statusText,
                            seatId: reserve.seatId
                        }
                    })
                    this.setData({
                        reservationList: reservations
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
        const seatId = e.currentTarget.dataset.seatId
        // console.log(e.currentTarget.dataset)
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
                        data: {
                            reservationId: reservationId
                            , seatId: seatId
                        },
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