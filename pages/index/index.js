// pages/index/index.js
const app = getApp()

Page({
  data: {
    isAdmin: false,
    notice: null,
    notifications: [],
    statistics: {
      totalSeats: 0,
      availableSeats: 0,
      occupiedSeats: 0
    },
    orderStats: {
      pendingCount: 0,
      approvedCount: 0,
      completedCount: 0
    },
    app: getApp(), // 添加app到data中，以便在wxml中访问
    modalVisible: false,
    modalTitle: '',
    modalContent: '',
    modalTime: '',
    buttonTop: 420, // 按钮初始位置
    buttonLeft: 350
  },

  onLoad: function (options) {
    // 检查登录状态，但不自动跳转到登录页
    // 而是在首页显示微信登录按钮
    this.setData({
      app: app
    })

    // 设置管理员状态
    this.setData({
      isAdmin: app.globalData.isAdmin
    })

    // 获取首页数据
    this.fetchHomeData()
  },

  onShow: function () {
    // 每次显示页面时刷新数据
    this.fetchHomeData()


    // 更新登录状态
    this.setData({
      app: app
    })

    // 检查用户权限并加载数据
    this.checkUserRole();

    // 获取座位统计
    this.getSeatStatistics();

    // 如果是管理员，获取订单统计
    if (this.data.isAdmin) {
      this.getReserveStatistics();
    }
  },

  // 检查用户角色和权限
  checkUserRole: function () {
    // 更新管理员状态
    const isAdmin = app.globalData.isAdmin || false;
    this.setData({
      isAdmin: isAdmin
    });
  },

  // 获取座位统计
  getSeatStatistics: function () {
    // 这个函数已经通过 fetchSeatStatistics 实现
    this.fetchSeatStatistics();
  },

  // 获取订单统计
  getReserveStatistics: function () {
    wx.cloud.callFunction({
      name: 'getReserveStatistics',
      success: res => {
        if (res.result && res.result.code === 0) {
          this.setData({
            orderStats: res.result.data
          });
        }
      },
      fail: err => {
        console.error('获取订单统计失败', err);
      }
    });
  },

  // 处理微信登录
  handleWechatLogin: function () {
    wx.navigateTo({
      url: '/pages/login/login'
    })
  },

  // 跳转到留言页面
  navigateToMessage: function () {
    wx.navigateTo({
      url: '/pages/message/message'
    })
  },

  // 获取首页数据
  fetchHomeData: function () {
    wx.showLoading({
      title: '加载中...',
    })

    // 获取最新通知
    // this.fetchLatestNotice()

    // 获取通知列表
    this.fetchNotifications()

    // 获取座位统计
    this.fetchSeatStatistics()

    wx.hideLoading()
  },


  // 获取通知列表
  fetchNotifications: function () {
    wx.cloud.callFunction({
      name: 'getNotifications',
      data: {
        limit: 5
      },
      success: res => {
        if (res.result.code === 0) {
          // 正确获取通知列表数据，通知列表在res.result.data.list中
          const notificationList = res.result.data.list || []
          this.setData({
            notifications: notificationList
          })
        }
      },
      fail: err => {
        console.error('获取通知列表失败', err)
      }
    })
  },

  // 获取座位统计
  fetchSeatStatistics: function () {
    wx.cloud.callFunction({
      name: 'getSeatStatistics',
      success: res => {
        if (res.result.code === 0) {
          this.setData({
            statistics: res.result.data
          })
        }
      },
      fail: err => {
        console.error('获取座位统计失败', err)
      }
    })
  },

  // 跳转到座位预订页面
  navigateToSeatreservation: function (e) {
    // 跳转到座位页面并自动筛选出空闲座位
    wx.setStorageSync('seatStatus', 'available');
    wx.switchTab({
      url: '/pages/seat/seat',
      success: function (res) {
        console.log('跳转成功', res)
      },
      fail: function (err) {
        console.error('跳转失败', err)
        wx.showToast({
          title: '跳转失败，请稍后再试',
          icon: 'none'
        })
      }
    })
  },

  // 跳转到我的预订页面
  navigateToMyreservations: function () {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.navigateTo({
        url: '/pages/login/login',
      })
      return
    }

    // 使用本地存储传递activeTab参数
    wx.setStorageSync('userActiveTab', 0);

    // 使用switchTab跳转到用户页面（不带查询参数）
    wx.switchTab({
      url: '/pages/user/user',
      success: function (res) {
        console.log('跳转成功', res)
      },
      fail: function (err) {
        console.error('跳转失败', err);
        // 如果switchTab失败，尝试使用navigateTo
        wx.navigateTo({
          url: '/pages/user/user'
        });
      }
    })
  },

  // 跳转到座位地图页面
  navigateToSeatMap: function () {
    wx.navigateTo({
      url: '/pages/seatmap/seatmap',
    })
  },

  // 跳转到留言反馈页面
  navigateToMessage: function () {
    wx.navigateTo({
      url: '/pages/message/message',
    })
  },

  // 查看通知详情
  viewNotification: function (e) {
    const title = e.currentTarget.dataset.title;
    const content = e.currentTarget.dataset.content;
    const time = e.currentTarget.dataset.time;

    this.setData({
      modalVisible: true,
      modalTitle: title,
      modalContent: content,
      modalTime: time
    });
  },

  // 关闭通知弹窗
  closeNoticeModal: function () {
    this.setData({
      modalVisible: false
    });
  },

  // 确认通知弹窗
  confirmNoticeModal: function () {
    this.setData({
      modalVisible: false
    });
  },

  // 跳转到管理后台
  navigateToAdmin: function () {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.navigateTo({
        url: '/pages/login/login',
      })
      return
    }

    // 使用本地存储传递activeTab参数(2表示管理后台标签页)
    wx.setStorageSync('userActiveTab', 2);

    // 跳转到用户页面
    wx.switchTab({
      url: '/pages/user/user',
      success: function (res) {
        console.log('跳转成功', res)
      },
      fail: function (err) {
        console.error('跳转失败', err);
        // 如果switchTab失败，尝试使用navigateTo
        wx.navigateTo({
          url: '/pages/user/user'
        });
      }
    })
  },

  // 获取订单统计
  getReserveStatistics: function () {
    wx.cloud.callFunction({
      name: 'getReserveStatistics',
      success: res => {
        if (res.result && res.result.code === 0) {
          this.setData({
            'orderStats': res.result.data
          });
        }
      },
      fail: err => {
        console.error('获取订单统计失败', err);
      }
    });
  },







  // 处理客服消息回调
  handleContact: function (e) {
    console.log('客服消息回调', e.detail)
    // 可以在这里处理客服消息回调
    // e.detail.path 是小程序消息指定的路径
    // e.detail.query 是小程序消息指定的查询参数
  },


  // 处理按钮拖动
  moveButton: function (e) {

    // 获取手指的坐标
    var touch = e.touches[0];

    // 设置按钮位置为手指位置
    this.setData({
      buttonTop: touch.clientY - 40,  // 减去按钮高度的一半，使按钮中心跟随手指
      buttonLeft: touch.clientX - 40  // 减去按钮宽度的一半，使按钮中心跟随手指
    });
  },
})

