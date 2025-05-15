// pages/admin/seat-edit/seat-edit.js
const app = getApp()

Page({
    data: {
        seatInfo: null,
        isAdmin: false
    },

    onLoad: function (options) {
        // 检查登录状态和管理员权限
        if (!app.globalData.isLoggedIn || !app.globalData.isAdmin) {
            wx.redirectTo({
                url: '/pages/login/login',
            })
            return
        }

        this.setData({
            isAdmin: app.globalData.isAdmin
        })

        // 获取座位ID参数
        const seatId = options.seatId
        if (!seatId) {
            wx.showToast({
                title: '缺少座位ID参数',
                icon: 'none'
            })
            wx.navigateBack()
            return
        }

        // 获取座位信息
        this.fetchSeatInfo(seatId)
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
                    this.setData({
                        seatInfo: res.result.data
                    })
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

    // 座位编号变更处理
    onSeatNumberChange: function (e) {
        this.setData({
            'seatInfo.seatNumber': e.detail.value
        })
    },

    // 座位区域变更处理
    onSeatAreaChange: function (e) {
        this.setData({
            'seatInfo.seatArea': e.detail.value
        })
    },

    // 座位类型变更处理
    onTypeChange: function (e) {
        const typeIndex = e.detail.value
        const typeArray = ['半沉浸', '沉浸桌', '侧进式']
        const type = typeArray[typeIndex]

        this.setData({
            'seatInfo.type': type
        })
    },

    // 座位状态变更处理
    onStatusChange: function (e) {
        const statusIndex = e.detail.value
        const statusOptions = ['available', 'occupied', 'reserved']
        const status = statusOptions[statusIndex]

        // 添加状态文本映射
        const statusTextMap = {
            'available': '空闲',
            'occupied': '已占用',
            'reserved': '已预订'
        }

        this.setData({
            'seatInfo.status': status,
            'seatInfo.statusText': statusTextMap[status] // 同步更新状态文本
        })
    },

    // 保存修改
    saveSeat: function () {
        const { seatInfo } = this.data
        if (!seatInfo) return

        wx.showLoading({
            title: '保存中...',
        })

        wx.cloud.callFunction({
            name: 'updateSeat',
            data: {
                seatId: seatInfo._id,
                updates: {
                    seatNumber: seatInfo.seatNumber,
                    seatArea: seatInfo.seatArea,
                    type: seatInfo.type,
                    status: seatInfo.status,
                    statusText: seatInfo.statusText // 新增statusText字段
                }
            },
            success: res => {
                wx.hideLoading()
                if (res.result.code === 0) {
                    wx.showToast({
                        title: '保存成功',
                        icon: 'success'
                    })
                    setTimeout(() => {
                        wx.navigateBack()
                    }, 1500)
                } else {
                    wx.showToast({
                        title: res.result.message || '保存失败',
                        icon: 'none'
                    })
                }
            },
            fail: err => {
                wx.hideLoading()
                console.error('保存座位信息失败', err)
                wx.showToast({
                    title: '保存失败，请稍后再试',
                    icon: 'none'
                })
            }
        })
    },

    // 删除座位
    deleteSeat: function () {
        wx.showModal({
            title: '确认删除',
            content: '确定要删除此座位吗？',
            confirmText: '确认删除',
            cancelText: '取消',
            confirmColor: '#ff4d4f',
            success: (res) => {
                if (res.confirm) {
                    wx.showLoading({
                        title: '删除中...',
                    });
                    wx.cloud.callFunction({
                        name: 'deleteSeat',
                        data: {
                            seatId: this.data.seatInfo._id
                        },
                        success: res => {
                            wx.hideLoading();
                            if (res.result.code === 0) {
                                wx.showToast({
                                    title: '删除成功',
                                    icon: 'success'
                                });
                                // 返回上一页
                                setTimeout(() => {
                                    wx.navigateBack();
                                }, 200);
                            } else {
                                wx.showToast({
                                    title: res.result.message || '删除失败',
                                    icon: 'none'
                                });
                            }
                        },
                        fail: err => {
                            wx.hideLoading();
                            console.error('删除座位失败', err);
                            wx.showToast({
                                title: '删除失败，请稍后再试',
                                icon: 'none'
                            });
                        }
                    });
                }
            }
        });
    },

    // 添加座位
    addSeat: function () {
        // 使用当前输入框中的值创建新座位
        const { seatInfo } = this.data

        // 验证必填字段
        if (!seatInfo.seatNumber || !seatInfo.seatArea) {
            wx.showToast({
                title: '请填写完整座位信息',
                icon: 'none'
            })
            return
        }

        // 准备新座位信息对象
        const newSeat = {
            seatNumber: seatInfo.seatNumber,
            seatArea: seatInfo.seatArea,
            type: seatInfo.type || '半沉浸',
            status: seatInfo.status || 'available',
            statusText: seatInfo.statusText || '空闲'
        }

        // 检查座位编号是否已存在并添加座位
        this.checkAndAddSeat(newSeat)
    },

    // 检查座位编号是否存在并添加座位
    checkAndAddSeat: function (seatInfo) {
        wx.showLoading({
            title: '添加中...',
        })

        // 调用云函数添加座位
        wx.cloud.callFunction({
            name: 'addSeat',
            data: seatInfo,
            success: res => {
                wx.hideLoading()
                if (res.result.code === 0) {
                    wx.showToast({
                        title: '添加成功',
                        icon: 'success'
                    })
                    // 返回上一页或刷新当前页面
                    setTimeout(() => {
                        wx.navigateBack()
                    }, 200)
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
})