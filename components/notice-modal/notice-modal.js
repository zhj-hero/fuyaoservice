// components/notice-modal/notice-modal.js
Component({
    properties: {
        visible: {
            type: Boolean,
            value: false
        },
        title: {
            type: String,
            value: ''
        },
        content: {
            type: String,
            value: ''
        },
        time: {
            type: String,
            value: ''
        }
    },

    data: {
        // 内部数据
    },

    methods: {
        // 关闭弹窗
        closeModal: function () {
            this.setData({
                visible: false
            });
            this.triggerEvent('close');
        },

        // 确认按钮点击
        confirmModal: function () {
            this.setData({
                visible: false
            });
            this.triggerEvent('confirm');
        },

        // 阻止冒泡，防止点击内容区域关闭弹窗
        preventBubble: function () {
            return false;
        }
    }
})