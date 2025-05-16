// pages/message/message.js
const app = getApp()

Page({
  /* 页面的初始数据*/
  data: {
    messageList: [],
    showEmpty: false,
    newMessageContent: '',
    newCommentContent: '',
    isAdmin: false,
    isLoggedIn: false,
    commentingMessageId: null,
    showCommentInput: false,
    replyingCommentId: null,
    nickNameMap: {}, // 添加用户昵称映射对象
  },

  /* 生命周期函数--监听页面加载*/
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

  /*生命周期函数--监听页面显示*/
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
  processComments: function (comments, nickNameMap) {
    return comments.map(comment => {
      return {
        ...comment,
        replyNickName: comment.parentId ? nickNameMap[comment.parentId] : null
      }
    });
  },

  // 检查文本是否需要展开收起功能
  checkContentNeedExpand: function (content) {
    // 计算文本的行数，如果超过两行则需要展开收起功能
    // 这里简单判断字符数，实际上可能需要更复杂的计算
    return content && content.length > 60; // 假设平均30个字符一行
  },

  // 切换留言展开收起状态
  toggleMessageExpand: function (e) {
    const messageId = e.currentTarget.dataset.id;
    const messageList = this.data.messageList;
    const index = messageList.findIndex(item => item._id === messageId);

    if (index !== -1) {
      const isExpanded = !messageList[index].isExpanded;
      const key = `messageList[${index}].isExpanded`;
      this.setData({
        [key]: isExpanded
      });
    }
  },

  // 切换评论展开收起状态
  toggleCommentExpand: function (e) {
    const messageId = e.currentTarget.dataset.messageId;
    const commentId = e.currentTarget.dataset.commentId;
    const messageList = this.data.messageList;
    const messageIndex = messageList.findIndex(item => item._id === messageId);

    if (messageIndex !== -1 && messageList[messageIndex].comments) {
      const commentIndex = messageList[messageIndex].comments.findIndex(comment => comment._id === commentId);
      if (commentIndex !== -1) {
        const isExpanded = !messageList[messageIndex].comments[commentIndex].isExpanded;
        const key = `messageList[${messageIndex}].comments[${commentIndex}].isExpanded`;
        this.setData({
          [key]: isExpanded
        });
      }
    }
  },

  // 切换评论列表显示状态
  toggleCommentList: function (e) {
    const messageId = e.currentTarget.dataset.id;
    const messageList = this.data.messageList;
    const index = messageList.findIndex(item => item._id === messageId);

    if (index !== -1) {
      const showComments = !messageList[index].showComments;
      const key = `messageList[${index}].showComments`;
      this.setData({
        [key]: showComments
      });
    }
  },

  // 处理消息列表数据
  processMessageListData: function (res) {
    // 构建用户名映射
    const nickNameMap = {};
    const messageList = res.result.data.list || [];

    messageList.forEach(message => {
      if (message.comments) {
        message.comments.forEach(comment => {
          nickNameMap[comment._id] = comment.nickName;
        });
      }
    });

    // 处理每条留言的评论，添加被回复者的用户名
    messageList.forEach(message => {
      // 检查留言内容是否需要展开收起
      message.needExpand = this.checkContentNeedExpand(message.content);
      message.isExpanded = false; // 默认收起状态

      if (message.comments && message.comments.length > 0) {
        message.comments = this.processComments(message.comments, nickNameMap);

        // 为每条评论添加展开收起状态
        message.comments.forEach(comment => {
          comment.needExpand = this.checkContentNeedExpand(comment.content);
          comment.isExpanded = false; // 默认收起状态
        });
      }
    });

    // 按时间排序
    messageList.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));

    return {
      messageList,
      showEmpty: messageList.length === 0,
      isAdmin: res.result.data.isAdmin,
      nickNameMap
    };
  },

  fetchMessageList: function () {
    wx.showLoading({
      title: '加载中...',
    })

    wx.cloud.callFunction({
      name: 'getMessages',
      success: res => {
        wx.hideLoading()
        if (res.result.code === 0) {
          const processedData = this.processMessageListData(res);
          this.setData(processedData);
        } else {
          this.setData({
            messageList: res.result.data.list || [],
            showEmpty: res.result.data.list.length === 0,
            isAdmin: res.result.data.isAdmin
          });
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
    if (e.detail.value.length > 140) {
      wx.showToast({
        title: '评论内容不能超过140字',
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
    // 直接从nickNameMap中获取用户名
    const replyToNickName = this.data.nickNameMap[commentId] || '用户';

    this.setData({
      commentingMessageId: e.currentTarget.dataset.id,
      replyingCommentId: commentId,
      replyToNickName: replyToNickName,
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
        replyToNickName: this.data.replyToNickName || '用户'  // 添加这一行
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
    const replyToNickName = this.data.nickNameMap[commentId] || '未知用户';
    return replyToNickName;
  },
})


