// pages/register/register.js
Page({
    data: {
        form: {
            name: '',
            phone: '',
            password: '',
            confirmPassword: ''
        }
    },

    onLoad: function (options) {
        // 页面加载时的初始化逻辑
    },

    // 表单输入处理
    handleInputChange: function (e) {
        const { field } = e.currentTarget.dataset;
        this.setData({
            [`form.${field}`]: e.detail.value
        });
    },

    // 提交注册
    submitRegister: function () {
        if (!this.data.form.name || !this.data.form.phone || !this.data.form.password || !this.data.form.confirmPassword) {
            wx.showToast({
                title: '请填写完整信息',
                icon: 'none'
            });
            return;
        }

        if (this.data.form.password !== this.data.form.confirmPassword) {
            wx.showToast({
                title: '两次密码输入不一致',
                icon: 'none'
            });
            return;
        }

        // 创建提交数据对象，不包含确认密码字段
        const submitData = {
            name: this.data.form.name,
            phone: this.data.form.phone,
            password: this.data.form.password
        };

        wx.cloud.callFunction({
            name: 'register',
            data: submitData,
            success: res => {
                wx.showToast({
                    title: '注册成功',
                    icon: 'success'
                });
                wx.navigateBack();
            },
            fail: err => {
                console.error('注册失败:', err);
                wx.showToast({
                    title: '注册失败',
                    icon: 'none'
                });
            }
        });
    },

    // 返回登录页面
    navigateBack: function () {
        wx.navigateBack();
    }
})