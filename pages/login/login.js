// pages/login/login.js
const app = getApp()

Page({
  data: {
    phone: '',
    password: '',
    showAuthModal: false,
    tempUserInfo: {
      avatarUrl: '',
      nickName: ''
    }
  },

  onLoad: function (options) {
    // 检查本地存储的用户信息
    const userInfo = wx.getStorageSync('userInfo');
    const token = wx.getStorageSync('token');

    // 如果本地有用户信息(曾经登录过)，直接使用
    if (userInfo && token) {
      // 更新全局数据
      app.globalData.userInfo = userInfo;
      app.globalData.token = token;
      app.globalData.isAdmin = userInfo.isAdmin || false;
      app.globalData.isLoggedIn = true; // 标记为已登录状态

      // 直接跳转首页
      wx.switchTab({
        url: '/pages/index/index',
      })
      return;
    }

    // 如果全局数据标记已登录但本地无数据，清除登录状态
    if (app.globalData.isLoggedIn && (!userInfo || !token)) {
      app.globalData.isLoggedIn = false;
      wx.removeStorageSync('token');
      wx.removeStorageSync('userInfo');
    }
  },

  // 输入手机号
  inputPhone: function (e) {
    this.setData({
      phone: e.detail.value
    })
  },

  // 输入密码
  inputPassword: function (e) {
    this.setData({
      password: e.detail.value
    })
  },

  // 账号密码登录
  handleLogin: function () {
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

          // 确保userInfo数据存在
          if (!userInfo) {
            console.error('登录返回的用户数据为空')
            wx.showToast({
              title: '登录异常，请重试',
              icon: 'none'
            })
            return
          }

          // 清除之前可能存在的用户数据
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')

          // 存储新的登录信息
          wx.setStorageSync('token', token)
          wx.setStorageSync('userInfo', userInfo)
          wx.setStorageSync('lastLoginTime', Date.now())

          // 更新全局数据
          app.globalData.isLoggedIn = true
          app.globalData.userInfo = userInfo
          app.globalData.token = token
          app.globalData.isAdmin = userInfo.isAdmin || false

          console.log('账号密码登录成功，用户数据已更新', userInfo)

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

  // 显示微信授权弹窗
  handleWechatLogin: function () {
    // 检查本地存储的用户信息
    const userInfo = wx.getStorageSync('userInfo');
    const token = wx.getStorageSync('token');

    // 如果已有有效用户信息且已登录，直接使用
    if (userInfo) {
      // 确保全局数据也更新
      app.globalData.isLoggedIn = true;
      app.globalData.userInfo = userInfo;
      app.globalData.token = token;
      app.globalData.isAdmin = userInfo.isAdmin || false;

      wx.switchTab({
        url: '/pages/index/index',
      })
      return;
    }

    // 否则显示授权弹窗
    this.setData({
      showAuthModal: true
    })
  },

  // 关闭授权弹窗
  closeAuthModal: function () {
    this.setData({
      showAuthModal: false
    })
  },

  // 获取微信头像
  onChooseAvatar: function (e) {
    const { avatarUrl } = e.detail
    // 使用wx.getFileSystemManager处理临时文件路径问题
    if (avatarUrl && avatarUrl.startsWith('wxfile://') || avatarUrl.startsWith('http://tmp/')) {
      // 将临时文件转为base64格式，避免文件路径错误
      try {
        const fs = wx.getFileSystemManager()
        const base64 = fs.readFileSync(avatarUrl, 'base64')
        const safeAvatarUrl = 'data:image/png;base64,' + base64
        this.setData({
          'tempUserInfo.avatarUrl': safeAvatarUrl
        })
      } catch (error) {
        console.error('头像文件读取失败', error)
        // 读取失败时使用默认头像
        this.setData({
          'tempUserInfo.avatarUrl': 'cloud://cloud1-7g0ti6rh5d59a178.636c-cloud1-7g0ti6rh5d59a178-1357504257/images/default-avatar.png'
        })
        wx.showToast({
          title: '头像处理失败，请重试',
          icon: 'none'
        })
      }
    } else {
      // 直接使用avatarUrl（可能是云存储或网络图片地址）
      this.setData({
        'tempUserInfo.avatarUrl': avatarUrl
      })
    }
  },

  // 获取微信昵称
  onInputNickname: function (e) {
    this.setData({
      'tempUserInfo.nickName': e.detail.value
    })
  },

  // 提交微信登录
  submitWechatLogin: async function () {
    const { avatarUrl, nickName } = this.data.tempUserInfo

    // 验证头像和昵称
    if (!avatarUrl || !nickName) {
      wx.showToast({
        title: '请完善头像和昵称',
        icon: 'none'
      })
      return
    }

    // 显示加载中
    wx.showLoading({
      title: '登录中...',
    })

    // 处理头像数据
    let processedAvatarUrl = avatarUrl

    // 如果是base64格式的头像，先上传到云存储
    if (processedAvatarUrl && processedAvatarUrl.startsWith('data:image')) {
      wx.showLoading({
        title: '处理头像中...',
      })

      try {
        // 将base64转为临时文件
        const base64Data = processedAvatarUrl.split(',')[1]
        const tempFilePath = `${wx.env.USER_DATA_PATH}/temp_avatar_${Date.now()}.png`
        const fs = wx.getFileSystemManager()
        fs.writeFileSync(tempFilePath, base64Data, 'base64')

        // 上传到云存储
        const cloudPath = `avatars/${Date.now()}_${Math.random().toString(36).substring(2)}.png`
        const uploadResult = await wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: tempFilePath
        })

        if (uploadResult.fileID) {
          processedAvatarUrl = uploadResult.fileID
          console.log('头像上传成功', processedAvatarUrl)
        }

        // 删除临时文件
        fs.unlinkSync(tempFilePath)
      } catch (error) {
        console.error('头像上传失败', error)
        // 上传失败时使用默认头像
        processedAvatarUrl = 'cloud://cloud1-7g0ti6rh5d59a178.636c-cloud1-7g0ti6rh5d59a178-1357504257/images/default-avatar.png'
      } finally {
        wx.hideLoading()
      }
    }

    // 调用云函数微信登录
    wx.cloud.callFunction({
      name: 'wechatLogin',
      data: {
        userInfo: {
          avatarUrl: processedAvatarUrl,
          nickName
        }
      },
      success: res => {
        wx.hideLoading()

        if (res.result.code === 0) {
          // 登录成功
          const { token, userInfo } = res.result.data

          // 确保userInfo数据存在
          if (!userInfo) {
            console.error('登录返回的用户数据为空')
            wx.showToast({
              title: '登录异常，请重试',
              icon: 'none'
            })
            return
          }

          // 清除之前可能存在的用户数据
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')

          // 存储新的登录信息
          wx.setStorageSync('token', token)
          wx.setStorageSync('userInfo', userInfo)
          wx.setStorageSync('lastLoginTime', Date.now())

          // 更新全局数据
          app.globalData.isLoggedIn = true
          app.globalData.userInfo = userInfo
          app.globalData.token = token
          app.globalData.isAdmin = userInfo.isAdmin || false

          console.log('微信登录成功，用户数据已更新', userInfo)

          // 关闭弹窗
          this.setData({
            showAuthModal: false
          })

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

  // 跳转到注册页面
  navigateToRegister: function () {
    wx.navigateTo({
      url: '/pages/register/register',
    })
  }
})