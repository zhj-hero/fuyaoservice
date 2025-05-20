// components/seat-detail-modal/seat-detail-modal.js
Component({
    properties: {
        show: {
            type: Boolean,
            value: false
        },
        seat: {
            type: Object,
            value: {}
        },
        isAdmin: {
            type: Boolean,
            value: false
        }
    },

    methods: {
        onClose() {
            this.triggerEvent('close');
        },

        onBook() {
            this.triggerEvent('book', this.data.seat);
        },

        onManage() {
            this.triggerEvent('manage', this.data.seat);
        }
    }
})