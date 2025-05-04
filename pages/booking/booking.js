// pages/booking/booking.js
const app = getApp()

Page({
  data: {
    seatId: '',
    seatInfo: null,
    date: '',
    startTime: '',
    endTime: '',
    remark: '',
    startTimeArray: [],
    endTimeArray: [],
    today: '',
    tomorrow: '',
    dateOptions: []
  },

  onLoad: function (options) {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/login/login',
      })
      return
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
            }, 1500)
          }
        } else {
          wx.showToast({
            title: res.result.message || '获取座位信息失败',
            icon: 'none'
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
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
        }, 1500)
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

    // 设置日期选项
    const dateOptions = [
      { label: '今天', value: today },
      { label: '明天', value: tomorrowStr }
    ]

    // 生成时间选项（8:00 - 22:00，每小时一个选项）
    const startTimeArray = []
    const endTimeArray = []

    for (let i = 8; i <= 21; i++) {
      const hour = i < 10 ? '0' + i : i
      startTimeArray.push(`${hour}:00`)
    }

    for (let i = 9; i <= 22; i++) {
      const hour = i < 10 ? '0' + i : i
      endTimeArray.push(`${hour}:00`)
    }

    this.setData({
      today,
      tomorrow: tomorrowStr,
      date: today,
      startTime: startTimeArray[0],
      endTime: endTimeArray[0],
      dateOptions,
      startTimeArray,
      endTimeArray
    })
  },

  // 选择日期
  bindDateChange: function (e) {
    this.setData({
      date: e.detail.value
    })
  },

  // 选择开始时间
  bindStartTimeChange: function (e) {
    const index = e.detail.value
    const startTime = this.data.startTimeArray[index]

    // 确保结束时间晚于开始时间
    const startHour = parseInt(startTime.split(':')[0])
    const endHour = parseInt(this.data.endTime.split(':')[0])

    if (endHour <= startHour) {
      // 如果结束时间早于或等于开始时间，自动调整结束时间
      const newEndTimeIndex = Math.min(index + 1, this.data.endTimeArray.length - 1)
      this.setData({
        startTime,
        endTime: this.data.endTimeArray[newEndTimeIndex]
      })
    } else {
      this.setData({
        startTime
      })
    }
  },

  // 选择结束时间
  bindEndTimeChange: function (e) {
    const index = e.detail.value
    const endTime = this.data.endTimeArray[index]

    // 确保结束时间晚于开始时间
    const startHour = parseInt(this.data.startTime.split(':')[0])
    const endHour = parseInt(endTime.split(':')[0])

    if (endHour <= startHour) {
      wx.showToast({
        title: '结束时间必须晚于开始时间',
        icon: 'none'
      })
    } else {
      this.setData({
        endTime
      })
    }
  },

  // 输入用途
  inputPurpose: function (e) {
    this.setData({
      purpose: e.detail.value
    })
  },

  // 输入备注
  inputRemark: function (e) {
    this.setData({
      remark: e.detail.value
    })
  },

  // 提交预订
  submitBooking: function () {
    const { seatId, date, startTime, endTime } = this.data


    // 显示加载中
    wx.showLoading({
      title: '提交中...',
    })

    // 调用云函数预订座位
    wx.cloud.callFunction({
      name: 'bookSeat',
      data: {
        seatId,
        date,
        startTime,
        endTime,
        purpose,
        remark: this.data.remark
      },
      success: res => {
        wx.hideLoading()

        if (res.result.code === 0) {
          wx.showToast({
            title: '预订成功',
            icon: 'success'
          })

          // 返回上一页
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
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

  // 取消预订
  cancelBooking: function () {
    wx.navigateBack()
  }
})