// pages/admin/user-edit/user-edit.js
const app = getApp()

Page({
    data: {
        userId: '',
        userData: null,
        isLoading: false
    },

    onLoad: function (options) {
        // 检查登录状态和管理员权限
        if (!app.globalData.isLoggedIn || !app.globalData.isAdmin) {
            wx.showToast({
                title: '无权限访问',
                icon: 'none',
                success: () => {
                    setTimeout(() => {
                        wx.navigateBack()
                    }, 1500)
                }
            })
            return
        }

        // 获取传递的用户ID和用户数据
        if (options.userId && options.userData) {
            try {
                const userId = options.userId
                const userData = JSON.parse(decodeURIComponent(options.userData))

                this.setData({
                    userId: userId,
                    userData: userData
                })
            } catch (error) {
                console.error('解析用户数据失败', error)
                wx.showToast({
                    title: '获取用户数据失败',
                    icon: 'none'
                })
            }
        } else {
            wx.showToast({
                title: '参数错误',
                icon: 'none',
                success: () => {
                    setTimeout(() => {
                        wx.navigateBack()
                    }, 1500)
                }
            })
        }
    },

    // 表单提交
    formSubmit: function (e) {
        const formData = e.detail.value

        // 表单验证
        if (!formData.name.trim()) {
            wx.showToast({
                title: '请输入用户姓名',
                icon: 'none'
            })
            return
        }

        // 准备更新的用户数据
        const updateData = {
            userId: this.data.userId,
            name: formData.name,
            phone: formData.phone,
            isAdmin: formData.isAdmin === 'true' // 转换为布尔值
        }

        this.updateUserInfo(updateData)
    },

    // 更新用户信息
    updateUserInfo: function (updateData) {
        this.setData({
            isLoading: true
        })

        wx.showLoading({
            title: '保存中...',
        })

        wx.cloud.callFunction({
            name: 'updateUser',
            data: updateData,
            success: res => {
                wx.hideLoading()
                this.setData({
                    isLoading: false
                })

                if (res.result.code === 0) {
                    wx.showToast({
                        title: '保存成功',
                        icon: 'success',
                        success: () => {
                            setTimeout(() => {
                                // 返回用户管理页面
                                wx.navigateBack()
                            }, 1500)
                        }
                    })
                } else {
                    wx.showToast({
                        title: res.result.message || '保存失败',
                        icon: 'none'
                    })
                }
            },
            fail: err => {
                wx.hideLoading()
                this.setData({
                    isLoading: false
                })
                console.error('更新用户信息失败', err)
                wx.showToast({
                    title: '更新用户信息失败，请稍后再试',
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