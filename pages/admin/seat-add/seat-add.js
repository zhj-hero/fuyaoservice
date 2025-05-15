Page({
    data: {
        seatInfo: {
            seatNumber: '',
            seatArea: '',
            type: '半沉浸',
            status: 'available',
            statusText: '空闲'
        }
    },

    onLoad: function (options) {
        // 初始化页面数据
    },

    onReady: function () {
        // 页面渲染完成
    },

    // 表单输入处理
    handleInputChange: function (e) {
        const { field } = e.currentTarget.dataset
        const { value } = e.detail
        this.setData({
            [`seatInfo.${field}`]: value
        })
    },

    // 座位编号变更
    onSeatNumberChange: function (e) {
        this.setData({
           'seatInfo.seatNumber': e.detail.value
        })
    },

    // 座位区域变更
    onSeatAreaChange: function (e) {
        this.setData({
            'seatInfo.seatArea': e.detail.value
        })
    },

    // 座位类型变更
    onTypeChange: function (e) {
        const typeIndex = e.detail.value
        const typeArray = ['半沉浸', '沉浸桌', '侧进式']
        const type = typeArray[typeIndex]

        this.setData({
            'seatInfo.type': type
        })
    },

    // 座位状态变更
    onStatusChange: function (e) {
        const statusIndex = e.detail.value
        const statusOptions = ['available', 'occupied', 'reserved']
        const status = statusOptions[statusIndex]

        // 状态文本映射
        const statusTextMap = {
            'available': '空闲',
            'occupied': '已占用',
            'reserved': '已预订'
        }

        this.setData({
            'seatInfo.status': status,
            'seatInfo.statusText': statusTextMap[status]
        })
    },

    // 添加座位
    addSeat: function () {
        const { seatInfo } = this.data
        if (!seatInfo) {
            this.setData({
                seatInfo: {
                    seatNumber: '',
                    seatArea: '',
                    type: '半沉浸',
                    status: 'available',
                    statusText: '空闲'
                }
            })
            return
        }

        // 验证必填字段
        if (!seatInfo.seatNumber || !seatInfo.seatArea) {
            wx.showToast({
                title: '请填写完整座位信息',
                icon: 'none'
            })
            return
        }

        wx.showLoading({
            title: '添加中...',
        })

        // 调用云函数添加座位
        wx.cloud.callFunction({
            name: 'addSeat',
            data: {
                seatNumber: seatInfo.seatNumber,
                seatArea: seatInfo.seatArea,
                type: seatInfo.type || '半沉浸',
                status: seatInfo.status || 'available',
                statusText: seatInfo.statusText || '空闲'
            },
            success: res => {
                wx.hideLoading()
                if (res.result.code === 0) {
                    wx.showToast({
                        title: '添加成功',
                        icon: 'success'
                    })
                    setTimeout(() => {
                        wx.navigateBack()
                    }, 1500)
                } else if (res.result.code === 2) {
                    // 座位编号已存在
                    wx.showToast({
                        title: '该座位编号已存在',
                        icon: 'none'
                    })
                } else {
                    wx.showToast({
                        title: res.result.message || '添加失败',
                        icon: 'none'
                    })
                }
            },
            fail: err => {
                wx.hideLoading()
                console.error('添加座位失败', err)
                wx.showToast({
                    title: '添加失败，请稍后再试',
                    icon: 'none'
                })
            }
        })
    },

    // 返回上一页
    goBack: function () {
        wx.navigateBack()
    }
})