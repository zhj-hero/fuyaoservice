// pages/message/message.js
const app = getApp()

Page({
  /**
   * 页面的初始数据
   */
  data: {
    messageList: [],
    showEmpty: false,
    newMessageContent: '',
    newCommentContent: '',
    currentPage: 1,
    pageSize: 10,
    totalMessages: 0,
    hasMoreMessages: false,
    isAdmin: false,
    isLoggedIn: false,
    commentingMessageId: null,
    showCommentInput: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 检查登录状态
    this.setData({
      isLoggedIn: app.globalData.isLoggedIn,
      isAdmin: app.globalData.isAdmin
    })

    // 获取留言列表
    this.fetchMessageList()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 更新登录状态
    this.setData({
      isLoggedIn: app.globalData.isLoggedIn,
      isAdmin: app.globalData.isAdmin
    })

    // 刷新留言列表
    this.fetchMessageList()
  },

  // 获取留言列表
  fetchMessageList: function (page = 1) {
    wx.showLoading({
      title: '加载中...',
    })

    wx.cloud.callFunction({
      name: 'getMessages',
      data: {
        page: page,
        pageSize: this.data.pageSize
      },
      success: res => {
        wx.hideLoading()
        if (res.result.code === 0) {
          // 正确获取留言列表数据
          const messageList = page === 1 ? res.result.data.list : [...this.data.messageList, ...res.result.data.list]
          const total = res.result.data.total
          const hasMore = messageList.length < total

          this.setData({
            messageList: messageList,
            showEmpty: messageList.length === 0,
            currentPage: page,
            totalMessages: total,
            hasMoreMessages: hasMore,
            isAdmin: res.result.data.isAdmin
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

  // 输入留言内容
  onMessageInput: function (e) {
    if (e.detail.value.length > 500) {
      wx.showToast({
        title: '留言内容不能超过500字',
        icon: 'none'
      })
      return
    }
    this.setData({
      newMessageContent: e.detail.value
    })
  },

  // 输入评论内容
  onCommentInput: function (e) {
    if (e.detail.value.length > 200) {
      wx.showToast({
        title: '评论内容不能超过200字',
        icon: 'none'
      })
      return
    }
    this.setData({
      newCommentContent: e.detail.value
    })
  },

  // 发送留言
  sendMessage: function () {
    // 检查登录状态
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    const { newMessageContent } = this.data
    if (!newMessageContent) {
      wx.showToast({
        title: '请输入留言内容',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '发送中...',
    })

    wx.cloud.callFunction({
      name: 'addMessage',
      data: {
        content: newMessageContent
      },
      success: res => {
        wx.hideLoading()
        if (res.result.code === 0) {
          wx.showToast({
            title: '留言成功',
            icon: 'success'
          })
          this.setData({
            newMessageContent: ''
          })
          this.fetchMessageList(1) // 刷新留言列表，回到第一页
        } else {
          wx.showToast({
            title: res.result.message || '留言失败',
            icon: 'none'
          })
        }
      },
      fail: err => {
        wx.hideLoading()
        console.error('发送留言失败', err)
        wx.showToast({
          title: '留言失败，请稍后再试',
          icon: 'none'
        })
      }
    })
  },

  // 显示评论输入框
  showCommentInput: function (e) {
    // 检查登录状态
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    const messageId = e.currentTarget.dataset.id
    this.setData({
      commentingMessageId: messageId,
      showCommentInput: true,
      newCommentContent: ''
    })
  },

  // 隐藏评论输入框
  hideCommentInput: function () {
    this.setData({
      commentingMessageId: null,
      showCommentInput: false,
      newCommentContent: ''
    })
  },

  // 发送评论
  sendComment: function () {
    // 检查登录状态
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    const { commentingMessageId, newCommentContent } = this.data
    if (!commentingMessageId) {
      wx.showToast({
        title: '评论对象不存在',
        icon: 'none'
      })
      return
    }

    if (!newCommentContent) {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '发送中...',
    })

    wx.cloud.callFunction({
      name: 'addComment',
      data: {
        messageId: commentingMessageId,
        content: newCommentContent
      },
      success: res => {
        wx.hideLoading()
        if (res.result.code === 0) {
          wx.showToast({
            title: '评论成功',
            icon: 'success'
          })
          this.hideCommentInput()
          this.fetchMessageList(this.data.currentPage) // 刷新当前页留言列表
        } else {
          wx.showToast({
            title: res.result.message || '评论失败',
            icon: 'none'
          })
        }
      },
      fail: err => {
        wx.hideLoading()
        console.error('发送评论失败', err)
        wx.showToast({
          title: '评论失败，请稍后再试',
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
                this.fetchMessageList(1) // 刷新留言列表，回到第一页
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
  },

  // 加载更多留言
  loadMoreMessages: function () {
    if (this.data.hasMoreMessages) {
      this.fetchMessageList(this.data.currentPage + 1)
    }
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    this.fetchMessageList(1)
    wx.stopPullDownRefresh()
  },

  // 上拉加载更多
  onReachBottom: function () {
    this.loadMoreMessages()
  },

  // 跳转到登录页
  navigateToLogin: function () {
    wx.navigateTo({
      url: '/pages/login/login'
    })
  }
})