// pages/user/user.js
const app = getApp()

Page({
    data: {
        userInfo: null,
        isAdmin: false,
        reservations: [],
        activeTab: 0,
        tabs: ['我的预订', '个人信息', '管理后台']
    },

    onLoad: function (options) {
        // 检查登录状态
        if (!app.globalData.isLoggedIn) {
            wx.redirectTo({
                url: '/pages/login/login',
            })
            return
        }

        // 获取用户信息
        const userInfo = app.globalData.userInfo;

        // 确保头像URL正确设置
        if (userInfo && !userInfo.avatarUrl && userInfo.userInfo && userInfo.userInfo.avatarUrl) {
            userInfo.avatarUrl = userInfo.userInfo.avatarUrl;
        }
        // 确保用户nickName正确设置
        if (userInfo && !userInfo.nickName && userInfo.userInfo && userInfo.userInfo.nickName) {
            userInfo.nickName = userInfo.userInfo.nickName;
        }

        // 设置用户信息和管理员状态
        this.setData({
            userInfo: userInfo,
            isAdmin: app.globalData.isAdmin,
            activeTab: options.activeTab ? parseInt(options.activeTab) : 0
        })

        console.log('onLoad用户信息:', userInfo);
    },

    onShow: function () {
        // 每次显示页面时从本地存储获取最新用户信息
        const userInfo = wx.getStorageSync('userInfo') || null;

        // 添加空值检查，确保userInfo不为null
        if (!userInfo) {
            console.log('用户信息为空，重定向到登录页面');
            wx.redirectTo({
                url: '/pages/login/login',
            });
            return;
        }

        // 从全局数据获取最新管理员状态
        const isAdmin = app.globalData.isAdmin || (userInfo && userInfo.isAdmin) ? true : false;
        app.globalData.userInfo = userInfo;
        app.globalData.isAdmin = isAdmin;

        // 检查是否有从首页传来的activeTab设置
        const userActiveTab = wx.getStorageSync('userActiveTab');

        // 处理头像URL
        let avatarUrl = '';
        // 直接从userInfo中获取avatarUrl
        if (userInfo.avatarUrl) {
            avatarUrl = userInfo.avatarUrl;
        }
        // 如果在userInfo.userInfo中有avatarUrl（微信授权情况）
        else if (userInfo.userInfo && userInfo.userInfo.avatarUrl) {
            avatarUrl = userInfo.userInfo.avatarUrl;
        }

        // 处理昵称
        let nickName = '';
        // 直接从userInfo中获取nickName
        if (userInfo.nickName) {
            nickName = userInfo.nickName;
        }
        // 如果在userInfo.userInfo中有nickName（微信授权情况）  
        else if (userInfo.userInfo && userInfo.userInfo.nickName) {
            nickName = userInfo.userInfo.nickName;
        }


        // 更新用户信息到全局数据，确保avatarUrl正确
        userInfo.avatarUrl = avatarUrl;
        userInfo.nickName = nickName;
        app.globalData.userInfo = userInfo;

        if (userActiveTab !== '' && userActiveTab !== null && userActiveTab !== undefined) {
            this.setData({
                activeTab: parseInt(userActiveTab),
                userInfo: userInfo,
                isAdmin: isAdmin
            });
            // 使用后清除，避免影响下次进入
            wx.removeStorageSync('userActiveTab');
        } else {
            this.setData({
                userInfo: userInfo,
                isAdmin: isAdmin
            });
        }

        // 打印用户信息，便于调试
        console.log('当前用户信息:', userInfo);

        this.fetchUserReservations();
        // 添加全局数据监听
        if (!this._userInfoListener) {
            this._userInfoListener = () => {
                // 获取最新的用户信息
                const updatedUserInfo = app.globalData.userInfo;
                // 确保头像URL正确设置
                if (updatedUserInfo) {
                    // 如果头像URL不存在，尝试从嵌套结构中获取
                    if (!updatedUserInfo.avatarUrl && updatedUserInfo.userInfo && updatedUserInfo.userInfo.avatarUrl) {
                        updatedUserInfo.avatarUrl = updatedUserInfo.userInfo.avatarUrl;
                    }
                }

                this.setData({
                    userInfo: updatedUserInfo,
                    isAdmin: app.globalData.isAdmin
                });

                console.log('用户信息已更新:', updatedUserInfo);
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
    fetchUserReservations: function () {
        wx.showLoading({
            title: '加载中...',
        })

        wx.cloud.callFunction({
            name: 'getUserReservations',
            data: {
                isAdmin: this.data.isAdmin,
                viewAllReserves: false // 仅查看用户自己的预订
            },
            success: res => {
                wx.hideLoading()

                if (res.result.code === 0) {
                    // 处理预订数据，确保兼容新旧数据格式
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
                            case 'completed':
                                statusText = '已完成';
                                break;
                        }
                        reserve.statusText = statusText;

                        // 确保兼容新旧数据格式
                        if (!reserve.startDate && reserve.date) {
                            reserve.startDate = reserve.date;
                        }
                        if (!reserve.endDate && reserve.date) {
                            reserve.endDate = reserve.date;
                        }

                        return reserve;
                    });

                    this.setData({
                        reservations: reservations
                    })
                } else {
                    console.error('获取预订信息失败:', res.result)
                    // 检查是否是集合不存在的错误
                    if (res.result.message && res.result.message.includes('collection not exists')) {
                        wx.showToast({
                            title: '预订数据未初始化，请联系管理员',
                            icon: 'none',
                            duration: 3000
                        })
                    } else {
                        wx.showToast({
                            title: res.result.message || '获取预订信息失败',
                            icon: 'none'
                        })
                    }
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
    cancelReserve: function (e) {
        const reserveId = e.currentTarget.dataset.id

        wx.showModal({
            title: '提示',
            content: '确定要取消该预订吗？',
            success: (res) => {
                if (res.confirm) {
                    this.doCancelReserve(reserveId)
                }
            }
        })
    },

    // 执行取消预订
    doCancelReserve: function (reserveId) {
        wx.showLoading({
            title: '取消中...',
        })

        wx.cloud.callFunction({
            name: 'cancelReservation',
            data: {
                reserveId: reserveId
            },
            success: res => {
                wx.hideLoading()

                if (res.result.code === 0) {
                    wx.showToast({
                        title: '取消成功',
                        icon: 'success'
                    })

                    // 刷新预订列表
                    this.fetchUserReservations()
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
    },
    // 导航到预订审核页面
    navigateToReservationReview: function () {
        wx.navigateTo({
            url: '/pages/admin/reservation-review/reservation-review',
        })
    },

    // 导航到通知管理页面
    navigateToNoticeManage: function () {
        wx.navigateTo({
            url: '/pages/admin/notice-manage/notice-manage',
        })
    },

    // 跳转到用户管理页面
    showUserManagement: function () {
        wx.navigateTo({
            url: '/pages/admin/user-manage/user-manage',
        })
    },

    // 跳转至座位管理页面
    navigateToAddSeat: function () {
        wx.navigateTo({
            url: '/pages/admin/seat-add/seat-add',
        })
    },

})