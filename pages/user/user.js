// pages/user/user.js
const app = getApp()

Page({
    data: {
        userInfo: null,
        isAdmin: false,
        bookings: [],
        activeTab: 0,
        tabs: ['我的预订', '个人信息']
    },

    onLoad: function (options) {
        // 检查登录状态
        if (!app.globalData.isLoggedIn) {
            wx.redirectTo({
                url: '/pages/login/login',
            })
            return
        }

        // 设置用户信息和管理员状态
        this.setData({
            userInfo: app.globalData.userInfo,
            isAdmin: app.globalData.isAdmin
        })
    },

    onShow: function () {
        // 每次显示页面时从本地存储获取最新用户信息
        const userInfo = wx.getStorageSync('userInfo') || null;
        const isAdmin = userInfo && userInfo.isAdmin ? true : false;
        app.globalData.userInfo = userInfo;
        app.globalData.isAdmin = isAdmin;
        this.setData({
            userInfo: userInfo,
            isAdmin: isAdmin
        });
        this.fetchUserBookings();
        // 添加全局数据监听
        if (!this._userInfoListener) {
            this._userInfoListener = () => {
                this.setData({
                    userInfo: app.globalData.userInfo,
                    isAdmin: app.globalData.isAdmin
                });
            };
            app.watchUserInfoChange(this._userInfoListener);
        }
    },

    onUnload: function () {
        // 移除监听
        if (this._userInfoListener) {
            app.unwatchUserInfoChange(this._userInfoListener)
        }
    },

    // 切换标签页
    switchTab: function (e) {
        const index = e.currentTarget.dataset.index
        this.setData({
            activeTab: index
        })
    },

    // 获取用户预订信息
    fetchUserBookings: function () {
        wx.showLoading({
            title: '加载中...',
        })

        wx.cloud.callFunction({
            name: 'getUserBookings',
            success: res => {
                wx.hideLoading()

                if (res.result.code === 0) {
                    this.setData({
                        bookings: res.result.data
                    })
                } else {
                    wx.showToast({
                        title: res.result.message || '获取预订信息失败',
                        icon: 'none'
                    })
                }
            },
            fail: err => {
                wx.hideLoading()
                console.error('获取预订信息失败', err)
                wx.showToast({
                    title: '获取预订信息失败，请稍后再试',
                    icon: 'none'
                })
            }
        })
    },

    // 取消预订
    cancelBooking: function (e) {
        const bookingId = e.currentTarget.dataset.id

        wx.showModal({
            title: '提示',
            content: '确定要取消该预订吗？',
            success: (res) => {
                if (res.confirm) {
                    this.doCancelBooking(bookingId)
                }
            }
        })
    },

    // 执行取消预订
    doCancelBooking: function (bookingId) {
        wx.showLoading({
            title: '取消中...',
        })

        wx.cloud.callFunction({
            name: 'cancelBooking',
            data: {
                bookingId
            },
            success: res => {
                wx.hideLoading()

                if (res.result.code === 0) {
                    wx.showToast({
                        title: '取消成功',
                        icon: 'success'
                    })

                    // 刷新预订列表
                    this.fetchUserBookings()
                } else {
                    wx.showToast({
                        title: res.result.message || '取消失败',
                        icon: 'none'
                    })
                }
            },
            fail: err => {
                wx.hideLoading()
                console.error('取消预订失败', err)
                wx.showToast({
                    title: '取消预订失败，请稍后再试',
                    icon: 'none'
                })
            }
        })
    },

    // 修改个人信息
    editUserInfo: function () {
        wx.navigateTo({
            url: '/pages/user/edit-profile',
        })
    },

    // 跳转到管理后台
    navigateToAdmin: function () {
        wx.navigateTo({
            url: '/pages/admin/admin',
        })
    },

    // 退出登录
    logout: function () {
        wx.showModal({
            title: '提示',
            content: '确定要退出登录吗？',
            success: (res) => {
                if (res.confirm) {
                    app.logout()
                }
            }
        })
    }
})