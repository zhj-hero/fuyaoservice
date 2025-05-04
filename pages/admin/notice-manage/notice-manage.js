// pages/admin/notice-manage/notice-manage.js
const app = getApp()

Page({
    data: {
        noticeList: [],
        newNoticeContent: '',
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

        // 获取通知列表
        this.fetchNoticeList()
    },

    // 获取通知列表
    fetchNoticeList: function () {
        wx.showLoading({
            title: '加载中...',
        })

        wx.cloud.callFunction({
            name: 'getNoticeList',
            success: res => {
                wx.hideLoading()
                if (res.result.code === 0) {
                    this.setData({
                        noticeList: res.result.data
                    })
                } else {
                    wx.showToast({
                        title: res.result.message || '获取通知列表失败',
                        icon: 'none'
                    })
                }
            },
            fail: err => {
                wx.hideLoading()
                console.error('获取通知列表失败', err)
                wx.showToast({
                    title: '获取通知列表失败，请稍后再试',
                    icon: 'none'
                })
            }
        })
    },

    // 输入通知内容
    onNoticeInput: function (e) {
        this.setData({
            newNoticeContent: e.detail.value
        })
    },

    // 发布通知
    publishNotice: function () {
        const { newNoticeContent } = this.data
        if (!newNoticeContent) {
            wx.showToast({
                title: '请输入通知内容',
                icon: 'none'
            })
            return
        }

        wx.showLoading({
            title: '发布中...',
        })

        wx.cloud.callFunction({
            name: 'addNotice',
            data: {
                content: newNoticeContent
            },
            success: res => {
                wx.hideLoading()
                if (res.result.code === 0) {
                    wx.showToast({
                        title: '发布成功',
                        icon: 'success'
                    })
                    this.setData({
                        newNoticeContent: ''
                    })
                    this.fetchNoticeList()
                } else {
                    wx.showToast({
                        title: res.result.message || '发布失败',
                        icon: 'none'
                    })
                }
            },
            fail: err => {
                wx.hideLoading()
                console.error('发布通知失败', err)
                wx.showToast({
                    title: '发布失败，请稍后再试',
                    icon: 'none'
                })
            }
        })
    },

    // 删除通知
    deleteNotice: function (e) {
        const noticeId = e.currentTarget.dataset.id
        wx.showModal({
            title: '确认删除',
            content: '确定要删除这条通知吗？',
            success: res => {
                if (res.confirm) {
                    wx.showLoading({
                        title: '删除中...',
                    })

                    wx.cloud.callFunction({
                        name: 'deleteNotice',
                        data: { noticeId },
                        success: res => {
                            wx.hideLoading()
                            if (res.result.code === 0) {
                                wx.showToast({
                                    title: '删除成功',
                                    icon: 'success'
                                })
                                this.fetchNoticeList()
                            } else {
                                wx.showToast({
                                    title: res.result.message || '删除失败',
                                    icon: 'none'
                                })
                            }
                        },
                        fail: err => {
                            wx.hideLoading()
                            console.error('删除通知失败', err)
                            wx.showToast({
                                title: '删除失败，请稍后再试',
                                icon: 'none'
                            })
                        }
                    })
                }
            }
        })
    }
})