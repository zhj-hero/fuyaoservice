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
    app: getApp() // 添加app到data中，以便在wxml中访问
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
  },

  // 处理微信登录
  handleWechatLogin: function () {
    wx.navigateTo({
      url: '/pages/login/login'
    })
  },

  // 获取首页数据
  fetchHomeData: function () {
    wx.showLoading({
      title: '加载中...',
    })

    // 获取最新通知
    this.fetchLatestNotice()

    // 获取通知列表
    this.fetchNotifications()

    // 获取座位统计
    this.fetchSeatStatistics()

    wx.hideLoading()
  },

  // 获取最新通知
  fetchLatestNotice: function () {
    wx.cloud.callFunction({
      name: 'getLatestNotice',
      success: res => {
        if (res.result.code === 0 && res.result.data) {
          this.setData({
            notice: res.result.data
          })
        }
      },
      fail: err => {
        console.error('获取最新通知失败', err)
      }
    })
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
          this.setData({
            notifications: res.result.data
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
  navigateToSeatBooking: function (e) {
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
  navigateToMyBookings: function () {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.navigateTo({
        url: '/pages/login/login',
      })
      return
    }

    wx.switchTab({
      url: '/pages/user/user?activeTab=0',
      success: function () {
        // 成功跳转后，设置activeTab
        const userPage = getCurrentPages().pop();
        if (userPage && userPage.route.includes('user')) {
          userPage.setData({
            activeTab: 0
          });
        }
      },
      fail: function (err) {
        console.error('跳转失败', err);
        // 如果switchTab失败，尝试使用navigateTo
        wx.navigateTo({
          url: '/pages/user/user?activeTab=0'
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
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/notification/detail?id=${id}',
    })
  },

  // 跳转到管理后台
  navigateToAdmin: function () {
    wx.navigateTo({
      url: '/pages/admin/admin',
    })
  }
})