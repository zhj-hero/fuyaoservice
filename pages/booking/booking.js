// pages/booking/booking.js
const app = getApp()

Page({
  data: {
    seatId: '',
    seatInfo: null,
    remark: '',
    name: '',
    phone: '',
    today: '',
    tomorrow: '',
    dateOptions: [],
    availableSeats: [],
    showSeatSelector: false,
    selectedSeatId: '',
    showSuccessModal: false  // 添加成功弹窗显示状态
  },

  onLoad: function (options) {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/login/login',
      })
      return
    }

    // 获取用户信息并填充表单
    if (app.globalData.userInfo) {
      const { name, phone } = app.globalData.userInfo
      this.setData({
        name: name || '',
        phone: phone || ''
      })
    }

    // 获取座位ID
    if (options.seatId) {
      this.setData({
        seatId: options.seatId
      })

      // 获取座位信息
      this.fetchSeatInfo(options.seatId)
    } else {
      wx.showToast({
        title: '座位信息不存在',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }

    // 初始化日期和时间选项
    this.initDateTimeOptions()
  },

  // 获取座位信息
  fetchSeatInfo: function (seatId) {
    wx.showLoading({
      title: '加载中...',
    })

    wx.cloud.callFunction({
      name: 'getSeatById',
      data: {
        seatId: seatId
      },
      success: res => {
        wx.hideLoading()

        if (res.result.code === 0) {
          const seat = res.result.data

          // 添加状态文本
          let statusText = '未知'
          switch (seat.status) {
            case 'available':
              statusText = '空闲'
              break
            case 'occupied':
              statusText = '已占用'
              break
            case 'reserved':
              statusText = '已预订'
              break
          }

          seat.statusText = statusText

          this.setData({
            seatInfo: seat
          })

          // 如果座位不可用，提示用户
          if (seat.status !== 'available') {
            wx.showToast({
              title: '该座位不可预订',
              icon: 'none'
            })
            setTimeout(() => {
              wx.navigateBack()
            }, 200)
          }
        } else {
          wx.showToast({
            title: res.result.message || '获取座位信息失败',
            icon: 'none'
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 200)
        }
      },
      fail: err => {
        wx.hideLoading()
        console.error('获取座位信息失败', err)
        wx.showToast({
          title: '获取座位信息失败，请稍后再试',
          icon: 'none'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 200)
      }
    })
  },

  // 初始化日期和时间选项
  initDateTimeOptions: function () {
    // 获取当前日期
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()

    // 格式化今天和明天的日期
    const today = `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`

    // 获取明天的日期
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tYear = tomorrow.getFullYear()
    const tMonth = tomorrow.getMonth() + 1
    const tDay = tomorrow.getDate()
    const tomorrowStr = `${tYear}-${tMonth < 10 ? '0' + tMonth : tMonth}-${tDay < 10 ? '0' + tDay : tDay}`

    // 设置最大日期（1年后）
    const maxDate = new Date(now)
    maxDate.setFullYear(maxDate.getFullYear() + 1)
    const maxYear = maxDate.getFullYear()
    const maxMonth = maxDate.getMonth() + 1
    const maxDay = maxDate.getDate()
    const maxDateStr = `${maxYear}-${maxMonth < 10 ? '0' + maxMonth : maxMonth}-${maxDay < 10 ? '0' + maxDay : maxDay}`

    this.setData({
      today,
      maxDate: maxDateStr,
      startDate: today,
      endDate: tomorrowStr
    })
  },

  // 选择开始日期
  bindStartDateChange: function (e) {
    this.setData({
      startDate: e.detail.value
    })

    // 如果结束日期早于开始日期，自动调整为开始日期
    if (new Date(this.data.endDate) < new Date(e.detail.value)) {
      this.setData({
        endDate: e.detail.value
      })
    }
  },

  // 选择结束日期
  bindEndDateChange: function (e) {
    // 确保结束日期不早于开始日期
    if (new Date(e.detail.value) < new Date(this.data.startDate)) {
      wx.showToast({
        title: '结束日期不能早于开始日期',
        icon: 'none'
      })
    } else {
      this.setData({
        endDate: e.detail.value
      })
    }
  },


  // 输入备注
  inputRemark: function (e) {
    this.setData({
      remark: e.detail.value
    })
  },

  // 输入姓名
  inputName: function (e) {
    this.setData({
      name: e.detail.value
    })
  },

  // 输入手机号
  inputPhone: function (e) {
    this.setData({
      phone: e.detail.value
    })
  },

  // 打开座位选择器
  openSeatSelector: function () {
    // 获取可用座位列表
    this.fetchAvailableSeats()
    this.setData({
      showSeatSelector: true
    })
  },

  // 关闭座位选择器
  closeSeatSelector: function () {
    this.setData({
      showSeatSelector: false
    })
  },

  // 获取可用座位列表
  fetchAvailableSeats: function () {
    wx.showLoading({
      title: '加载中...',
    })

    wx.cloud.callFunction({
      name: 'getSeats',
      data: {
        status: 'available'
      },
      success: res => {
        wx.hideLoading()

        if (res.result.code === 0) {
          // 确保只返回状态为available的座位
          const seats = res.result.data
            .filter(seat => seat.status === 'available')
            .map(seat => ({
              ...seat,
              statusText: '空闲'
            }))

          this.setData({
            availableSeats: seats
          })
        } else {
          wx.showToast({
            title: res.result.message || '获取座位失败',
            icon: 'none'
          })
        }
      },
      fail: err => {
        wx.hideLoading()
        console.error('获取座位失败', err)
        wx.showToast({
          title: '获取座位失败，请稍后再试',
          icon: 'none'
        })
      }
    })
  },

  // 选择座位
  selectSeat: function (e) {
    const seatId = e.currentTarget.dataset.id
    this.setData({
      selectedSeatId: seatId,
      showSeatSelector: false
    })

    // 获取选中座位的信息
    this.fetchSeatInfo(seatId)
  },

  // 提交预订
  submitBooking: function () {
    const { userId, seatId, startDate, endDate, seatInfo } = this.data

    if (!seatId) {
      wx.showToast({
        title: '请选择座位',
        icon: 'none'
      })
      return
    }

    if (!this.data.name) {
      wx.showToast({
        title: '请输入姓名',
        icon: 'none'
      })
      return
    }

    if (!this.data.phone) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      })
      return
    }

    // 显示加载中
    wx.showLoading({
      title: '提交中...',
    })

    // 调用云函数预订座位
    wx.cloud.callFunction({
      name: 'bookSeat',
      data: {
        seatId,
        seatNumber: seatInfo ? seatInfo.seatNumber : '', // 传递座位号
        startDate,
        endDate,
        remark: this.data.remark,
        name: this.data.name,
        phone: this.data.phone
      },
      success: res => {
        wx.hideLoading()

        if (!res || !res.result) {
          wx.showToast({
            title: '请求失败，请重试',
            icon: 'none'
          })
          return
        }

        if (res.result.code === 0) {
          // 显示成功弹窗，而不是Toast
          this.setData({
            showSuccessModal: true
          })
        } else {
          wx.showToast({
            title: res.result.message || '预订失败',
            icon: 'none'
          })
        }
      },
      fail: err => {
        wx.hideLoading()
        console.error('预订失败', err)
        wx.showToast({
          title: '预订失败，请稍后再试',
          icon: 'none'
        })
      }
    })
  },

  // 关闭成功弹窗
  closeSuccessModal: function() {
    this.setData({
      showSuccessModal: false
    })
    wx.navigateBack()
  },

  // 处理客服消息回调
  handleContact: function(e) {
    console.log('客服消息回调', e.detail)
    // 可以在这里处理客服消息回调
    this.closeSuccessModal()
  },

  // 取消预订
  cancelBooking: function () {
    wx.navigateBack()
  }
})