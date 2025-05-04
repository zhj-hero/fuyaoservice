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

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })

    // 检查登录状态
    this.checkLoginStatus()
  },

  // 检查登录状态
  checkLoginStatus: function () {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')

    if (token && userInfo) {
      this.globalData.isLoggedIn = true
      this.globalData.userInfo = userInfo
      this.globalData.token = token
    }
  },

  // 登录方法
  login: function (userInfo, callback) {
    // 调用云函数登录
    wx.cloud.callFunction({
      name: 'login',
      data: {
        userInfo: userInfo
      },
      success: res => {
        console.log('登录成功', res)
        const { token, userInfo } = res.result

        // 存储登录信息
        wx.setStorageSync('token', token)
        wx.setStorageSync('userInfo', userInfo)

        this.globalData.isLoggedIn = true
        this.globalData.userInfo = userInfo
        this.globalData.token = token

        if (callback) {
          callback(true)
        }
      },
      fail: err => {
        console.error('登录失败', err)
        if (callback) {
          callback(false)
        }
      }
    })
  },

  // 退出登录
  logout: function () {
    // 清除本地存储
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')

    // 重置全局数据
    this.globalData = {
      userInfo: null,
      isLoggedIn: false,
      token: null,
      isAdmin: false
    }

    // 清空内存缓存并跳转登录页
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