// app.js
App({
  onLaunch: function () {
    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloud1-7g0ti6rh5d59a178', // 腾讯云环境ID
        traceUser: true,
      })
    }

    // 初始化数据库连接
    this.db = wx.cloud.database()

    // 检查登录状态
    this.checkLoginStatus()
  },

  // 检查登录状态
  checkLoginStatus: function () {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    const lastLoginTime = wx.getStorageSync('lastLoginTime')

    // 检查token是否过期（30天）
    if (lastLoginTime && Date.now() - lastLoginTime > 30 * 24 * 60 * 60 * 1000) {
      wx.removeStorageSync('token')
      wx.removeStorageSync('userInfo')
      this.globalData.isLoggedIn = false
      this.globalData.token = null
      this.globalData.userInfo = null
      return
    }

    // 如果有用户信息，更新全局数据
    if (userInfo) {
      this.globalData.userInfo = userInfo
      this.globalData.token = token || null
      this.globalData.isAdmin = userInfo.isAdmin || false
      // 只有在有token的情况下才标记为已登录
      this.globalData.isLoggedIn = !!token
    }
  },


  // 退出登录
  logout: function () {
    // 只清除token，保留用户信息
    wx.removeStorageSync('token')
    // wx.removeStorageSync('userInfo')
    // 保留userInfo，不再清除

    // 标记为未登录状态
    this.globalData.isLoggedIn = false
    this.globalData.token = null
    this.globalData.isAdmin = false

    // 跳转登录页
    wx.reLaunch({
      url: '/pages/login/login?t=' + Date.now()
    })
  },

  // 用户信息监听器列表
  _userInfoListeners: [],

  // 添加用户信息变化监听
  watchUserInfoChange: function (listener) {
    this._userInfoListeners.push(listener);
  },

  // 移除用户信息变化监听
  unwatchUserInfoChange: function (listener) {
    const index = this._userInfoListeners.indexOf(listener);
    if (index !== -1) {
      this._userInfoListeners.splice(index, 1);
    }
  },

  // 通知所有监听器用户信息已变化
  _notifyUserInfoChange: function () {
    this._userInfoListeners.forEach(listener => {
      listener();
    });
  },

  globalData: {
    userInfo: null,
    isLoggedIn: false,
    token: null,
    isAdmin: false
  }
})