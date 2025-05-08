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
    showCommentInput: false,
    replyingCommentId: null,
    userNameMap: {}, // 添加用户名映射对象
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 检查登录状态
    this.setData({
      isLoggedIn: app.globalData.isLoggedIn,
      isAdmin: app.globalData.isAdmin,
      openid: app.globalData.openid || ''  // 添加这一行
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

  // 处理评论数据，添加被回复者的用户名
  processComments: function (comments, userNameMap) {
    return comments.map(comment => {
      return {
        ...comment,
        replyUserName: comment.parentId ? userNameMap[comment.parentId] : null
      }
    });
  },

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
          // 构建用户名映射
          const userNameMap = {};
          const messageList = page === 1 ? res.result.data.list : [...this.data.messageList, ...res.result.data.list];

          messageList.forEach(message => {
            if (message.comments) {
              message.comments.forEach(comment => {
                userNameMap[comment._id] = comment.userName;
              });
            }
          });

          // 处理每条留言的评论，添加被回复者的用户名
          messageList.forEach(message => {
            if (message.comments && message.comments.length > 0) {
              message.comments = this.processComments(message.comments, userNameMap);
            }
          });

          const total = res.result.data.total;
          const hasMore = messageList.length < total;

          this.setData({
            messageList: messageList,
            showEmpty: messageList.length === 0,
            currentPage: page,
            totalMessages: total,
            hasMoreMessages: hasMore,
            isAdmin: res.result.data.isAdmin,
            userNameMap: userNameMap // 更新用户名映射
          });
        } else {
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
      newCommentContent: '',
      replyingCommentId: null
    })
  },

  // 在showReplyInput方法中保存被回复者用户名
  showReplyInput: function (e) {
    // 检查登录状态
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    // 获取被回复评论的用户名
    const commentId = e.currentTarget.dataset.commentId;
    // 直接从userNameMap中获取用户名
    const replyToUserName = this.data.userNameMap[commentId] || '用户';

    this.setData({
      commentingMessageId: e.currentTarget.dataset.id,
      replyingCommentId: commentId,
      replyToUserName: replyToUserName,
      showCommentInput: true,
      newCommentContent: ''
    });
  },

  // 在sendComment方法中传递被回复者用户名
  sendComment: function () {
    // 检查登录状态
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    const { commentingMessageId, newCommentContent, replyingCommentId } = this.data
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
        content: newCommentContent,
        parentId: replyingCommentId,
        replyToUserName: this.data.replyToUserName || '用户'  // 添加这一行
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

  // 隐藏评论输入框
  hideCommentInput: function () {
    this.setData({
      commentingMessageId: null,
      showCommentInput: false,
      newCommentContent: ''
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

  // 删除评论
  deleteComment: function (e) {
    const messageId = e.currentTarget.dataset.messageId
    const commentId = e.currentTarget.dataset.commentId

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条评论吗？',
      success: res => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...',
          })

          wx.cloud.callFunction({
            name: 'deleteComment',
            data: {
              messageId: messageId,
              commentId: commentId
            },
            success: res => {
              wx.hideLoading()
              if (res.result.code === 0) {
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                })
                this.fetchMessageList(this.data.currentPage) // 刷新当前页留言列表
              } else {
                wx.showToast({
                  title: res.result.message || '删除失败',
                  icon: 'none'
                })
              }
            },
            fail: err => {
              wx.hideLoading()
              console.error('删除评论失败', err)
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
  },

  // 获取回复对象的用户名
  getReplyToName: function (commentId) {
    if (!commentId || commentId.trim() === '') {
      return '未知用户';
    }
    const replyToUserName = this.data.userNameMap[commentId] || '未知用户';
    return replyToUserName;
  },
})


