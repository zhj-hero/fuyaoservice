// pages/user/edit-profile.js
const app = getApp()

Page({
    data: {
        userInfo: null,
        formData: {
            name: '',
            phone: '',
        }
    },

    onLoad: function (options) {
        // 检查登录状态
        if (!app.globalData.isLoggedIn) {
            wx.redirectTo({
                url: '/pages/login/login',
            })
            return
        }

        // 初始化表单数据
        this.setData({
            userInfo: app.globalData.userInfo,
            formData: {
                name: app.globalData.userInfo.name || '',
                phone: app.globalData.userInfo.phone || '',
            }
        })
    },

    // 表单输入处理
    handleInputChange: function (e) {
        const { field } = e.currentTarget.dataset
        this.setData({
            [`formData.${field}`]: e.detail.value
        })
    },

    // 提交修改
    handleSubmit: function () {
        const { formData } = this.data

        // 表单验证
        if (!formData.name) {
            wx.showToast({
                title: '姓名不能为空',
                icon: 'none'
            })
            return
        }

        // 手机号格式验证
        if (formData.phone && !/^1\d{10}$/.test(formData.phone)) {
            wx.showToast({
                title: '请输入正确的手机号',
                icon: 'none'
            })
            return
        }

        wx.showLoading({
            title: '提交中...',
        })

        // 调用云函数更新用户信息
        wx.cloud.callFunction({
            name: 'updateUserInfo',
            data: {
                userInfo: formData
            },
            success: res => {
                wx.hideLoading()

                if (res.result.code === 0) {
                    // 更新全局用户信息
                    app.globalData.userInfo = {
                        ...app.globalData.userInfo,
                        ...formData
                    }

                    // 更新本地存储
                    wx.setStorageSync('userInfo', app.globalData.userInfo)

                    wx.showToast({
                        title: '修改成功',
                        icon: 'success'
                    })

                    // 返回上一页并刷新数据
                    const pages = getCurrentPages()
                    const prevPage = pages[pages.length - 1]
                    if (prevPage) {
                        prevPage.onShow()
                    }
                    wx.navigateBack()
                } else {
                    wx.showToast({
                        title: res.result.message || '修改失败',
                        icon: 'none'
                    })
                }
            },
            fail: err => {
                wx.hideLoading()
                console.error('修改个人信息失败', {
                    formData: formData,
                    error: err
                })

                wx.showToast({
                    title: '修改失败: ' + (err.errMsg || '请稍后再试'),
                    icon: 'none',
                    duration: 3000
                })
            }
        })
    }
})