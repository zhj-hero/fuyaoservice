// pages/login/login.js
const app = getApp()

Page({
  data: {
    phone: '',
    password: ''
  },

  onLoad: function (options) {
    // 如果已经登录，直接跳转到首页
    if (app.globalData.isLoggedIn) {
      wx.switchTab({
        url: '/pages/index/index',
      })
    }
  },

  // 输入手机号
  inputPhone: function(e) {
    this.setData({
      phone: e.detail.value
    })
  },

  // 输入密码
  inputPassword: function(e) {
    this.setData({
      password: e.detail.value
    })
  },

  // 账号密码登录
  handleLogin: function() {
    const { phone, password } = this.data
    
    // 表单验证
    if (!phone || !password) {
      wx.showToast({
        title: '手机号和密码不能为空',
        icon: 'none'
      })
      return
    }
    
    // 显示加载中
    wx.showLoading({
      title: '登录中...',
    })
    
    // 调用云函数登录
    wx.cloud.callFunction({
      name: 'userLogin',
      data: {
        phone,
        password
      },
      success: res => {
        wx.hideLoading()
        
        if (res.result.code === 0) {
          // 登录成功
          const { token, userInfo } = res.result.data
          
          // 存储登录信息
          wx.setStorageSync('token', token)
          wx.setStorageSync('userInfo', userInfo)
          
          app.globalData.isLoggedIn = true
          app.globalData.userInfo = userInfo
          app.globalData.token = token
          app.globalData.isAdmin = userInfo.isAdmin || false
          
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          })
          
          // 跳转到首页
          wx.switchTab({
            url: '/pages/index/index',
          })
        } else {
          // 登录失败
          wx.showToast({
            title: res.result.message || '登录失败',
            icon: 'none'
          })
        }
      },
      fail: err => {
        wx.hideLoading()
        console.error('登录失败', err)
        wx.showToast({
          title: '登录失败，请稍后再试',
          icon: 'none'
        })
      }
    })
  },

  // 微信一键登录
  handleWechatLogin: function() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo
        
        // 显示加载中
        wx.showLoading({
          title: '登录中...',
        })
        
        // 调用云函数微信登录
        wx.cloud.callFunction({
          name: 'wechatLogin',
          data: {
            userInfo
          },
          success: res => {
            wx.hideLoading()
            
            if (res.result.code === 0) {
              // 登录成功
              const { token, userInfo } = res.result.data
              
              // 存储登录信息
              wx.setStorageSync('token', token)
              wx.setStorageSync('userInfo', userInfo)
              
              app.globalData.isLoggedIn = true
              app.globalData.userInfo = userInfo
              app.globalData.token = token
              app.globalData.isAdmin = userInfo.isAdmin || false
              
              wx.showToast({
                title: '登录成功',
                icon: 'success'
              })
              
              // 跳转到首页
              wx.switchTab({
                url: '/pages/index/index',
              })
            } else {
              // 登录失败
              wx.showToast({
                title: res.result.message || '登录失败',
                icon: 'none'
              })
            }
          },
          fail: err => {
            wx.hideLoading()
            console.error('微信登录失败', err)
            wx.showToast({
              title: '登录失败，请稍后再试',
              icon: 'none'
            })
          }
        })
      },
      fail: (err) => {
        console.log('获取用户信息失败', err)
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        })
      }
    })
  },

  // 跳转到注册页面
  navigateToRegister: function() {
    wx.navigateTo({
      url: '/pages/register/register',
    })
  }
})