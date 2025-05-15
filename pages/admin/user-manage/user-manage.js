// pages/admin/user-manage/user-manage.js
const app = getApp()

Page({
    data: {
        userList: [],
        isLoading: false
    },

    onLoad: function (options) {
        // 检查登录状态和管理员权限
        if (!app.globalData.isLoggedIn || !app.globalData.isAdmin) {
            wx.showToast({
                title: '无权限访问',
                icon: 'none',
                success: () => {
                    setTimeout(() => {
                        wx.navigateBack()
                    }, 1500)
                }
            })
            return
        }
    },

    onShow: function () {
        this.fetchUserList()
    },

    // 获取用户列表
    fetchUserList: function () {
        this.setData({
            isLoading: true
        })

        wx.showLoading({
            title: '加载中...',
        })

        wx.cloud.callFunction({
            name: 'getUserList',
            success: res => {
                wx.hideLoading()
                this.setData({
                    isLoading: false
                })

                if (res.result.code === 0) {
                    this.setData({
                        userList: res.result.data
                    })
                } else {
                    wx.showToast({
                        title: res.result.message || '获取用户列表失败',
                        icon: 'none'
                    })
                }
            },
            fail: err => {
                wx.hideLoading()
                this.setData({
                    isLoading: false
                })
                console.error('获取用户列表失败', err)
                wx.showToast({
                    title: '获取用户列表失败，请稍后再试',
                    icon: 'none'
                })
            }
        })
    },

    // 删除用户
    deleteUser: function (e) {
        const userId = e.currentTarget.dataset.id

        wx.showModal({
            title: '提示',
            content: '确定要删除该用户吗',
            success: (res) => {
                if (res.confirm) {
                    this.doDeleteUser(userId)
                }
            }
        })
    },

    // 执行删除用户操作
    doDeleteUser: function (userId) {
        wx.showLoading({
            title: '删除中...',
        })

        wx.cloud.callFunction({
            name: 'deleteUser',
            data: {
                userId: userId
            },
            success: res => {
                wx.hideLoading()

                if (res.result.code === 0) {
                    wx.showToast({
                        title: '删除成功',
                        icon: 'success'
                    })

                    // 刷新用户列表
                    this.fetchUserList()
                } else {
                    wx.showToast({
                        title: res.result.message || '删除失败',
                        icon: 'none'
                    })
                }
            },
            fail: err => {
                wx.hideLoading()
                console.error('删除用户失败', err)
                wx.showToast({
                    title: '删除用户失败，请稍后再试',
                    icon: 'none'
                })
            }
        })
    },

    // 编辑用户
    editUser: function (e) {
        const userId = e.currentTarget.dataset.id
        const userData = e.currentTarget.dataset.user

        // 将用户数据转为字符串，通过URL参数传递
        const userDataStr = encodeURIComponent(JSON.stringify(userData))

        // 跳转到用户编辑页面
        wx.navigateTo({
            url: `/pages/admin/user-edit/user-edit?userId=${userId}&userData=${userDataStr}`
        })
    }
})