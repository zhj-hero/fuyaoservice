// pages/admin/message-manage/message-manage.js
const app = getApp()

Page({
    data: {
        messageList: [],
        replyContent: '',
        currentReplyId: null,
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

        // 获取留言列表
        this.fetchMessageList()
    },

    // 获取留言列表
    fetchMessageList: function () {
        wx.showLoading({
            title: '加载中...',
        })

        wx.cloud.callFunction({
            name: 'getMessages',
            success: res => {
                wx.hideLoading()
                if (res.result.code === 0) {
                    this.setData({
                        messageList: res.result.data
                    })
                } else {
                    wx.showToast({
                        title: res.result.message || '获取留言列表失败',
                        icon: 'none'
                    })
                }
            },
            fail: err => {
                wx.hideLoading()
                console.error('获取留言列表失败', err)
                wx.showToast({
                    title: '获取留言列表失败，请稍后再试',
                    icon: 'none'
                })
            }
        })
    },

    // 输入回复内容
    onReplyInput: function (e) {
        this.setData({
            replyContent: e.detail.value
        })
    },

    // 开始回复
    startReply: function (e) {
        const messageId = e.currentTarget.dataset.id
        this.setData({
            currentReplyId: messageId,
            replyContent: ''
        })
    },

    // 提交回复
    submitReply: function () {
        const { replyContent, currentReplyId } = this.data
        if (!replyContent) {
            wx.showToast({
                title: '请输入回复内容',
                icon: 'none'
            })
            return
        }

        wx.showLoading({
            title: '回复中...',
        })

        wx.cloud.callFunction({
            name: 'replyMessage',
            data: {
                messageId: currentReplyId,
                replyContent: replyContent
            },
            success: res => {
                wx.hideLoading()
                if (res.result.code === 0) {
                    wx.showToast({
                        title: '回复成功',
                        icon: 'success'
                    })
                    this.setData({
                        currentReplyId: null,
                        replyContent: ''
                    })
                    this.fetchMessageList()
                } else {
                    wx.showToast({
                        title: res.result.message || '回复失败',
                        icon: 'none'
                    })
                }
            },
            fail: err => {
                wx.hideLoading()
                console.error('回复失败', err)
                wx.showToast({
                    title: '回复失败，请稍后再试',
                    icon: 'none'
                })
            }
        })
    },

    // 删除留言
    deleteMessage: function (e) {
        const messageId = e.currentTarget.dataset.id
        wx.showModal({
            title: '确认删除',
            content: '确定要删除这条留言吗？',
            success: res => {
                if (res.confirm) {
                    wx.showLoading({
                        title: '删除中...',
                    })

                    wx.cloud.callFunction({
                        name: 'deleteMessage',
                        data: { messageId },
                        success: res => {
                            wx.hideLoading()
                            if (res.result.code === 0) {
                                wx.showToast({
                                    title: '删除成功',
                                    icon: 'success'
                                })
                                this.fetchMessageList()
                            } else {
                                wx.showToast({
                                    title: res.result.message || '删除失败',
                                    icon: 'none'
                                })
                            }
                        },
                        fail: err => {
                            wx.hideLoading()
                            console.error('删除留言失败', err)
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