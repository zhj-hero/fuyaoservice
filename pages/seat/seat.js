// pages/seat/seat.js
const app = getApp()

Page({
    data: {
        isAdmin: false,
        seats: [],
        filteredSeats: [],
        searchText: '',
        filterOptions: ['全部', '空闲', '已预订', '已占用'],
        filterIndex: 0,
        showSeatDetail: false,
        selectedSeat: null
    },

    // 根据区域筛选座位
    filterByArea: function (e) {
        // 从事件中获取选中的区域
        const area = e.currentTarget.dataset.area;
        let filtered = [];

        // 如果选择全部区域，则返回所有座位
        if (area === 'all') {
            filtered = [...this.data.seats];
        } else {
            // 否则筛选出指定区域的座位
            filtered = this.data.seats.filter(seat => seat.seatArea === area);
        }


        // 更新数据，重置搜索文本和筛选索引
        this.setData({
            filteredSeats: filtered,
            searchText: '',
            filterIndex: 0
        });
    },

    onLoad: function (options) {
        // 检查登录状态
        if (!app.globalData.isLoggedIn) {
            wx.redirectTo({
                url: '/pages/login/login',
            })
            return
        }

        // 设置管理员状态
        this.setData({
            isAdmin: app.globalData.isAdmin
        })

        // 尝试从 Storage 读取筛选状态 (首次加载时应用)
        const seatStatusOnLoad = wx.getStorageSync('seatStatus');
        let initialFilterIndex = 0; // 默认显示全部
        if (seatStatusOnLoad === 'available') {
            initialFilterIndex = 1; // 1 对应空闲座位
            // 注意：此处不清除，留给 onShow 处理，确保 switchTab 生效
        }
        this.setData({
            filterIndex: initialFilterIndex
        });

        // 获取座位数据（fetchSeats内部会调用filterSeats应用filterIndex）
        this.fetchSeats()
    },

    onShow: function () {
        // 尝试从 Storage 读取筛选状态 (处理 switchTab 或页面返回)
        const seatStatusOnShow = wx.getStorageSync('seatStatus');
        if (seatStatusOnShow === 'available') {
            this.setData({
                filterIndex: 1 // 1 对应空闲座位
            });
            // 读取并应用后立即清除状态，避免影响后续访问
            wx.removeStorageSync('seatStatus');
        }
        // 如果 storage 中没有状态，则不改变当前的 filterIndex
        // 这样可以保留用户在页面上自己选择的筛选条件

        // 每次显示页面时刷新数据
        // fetchSeats 内部会调用 filterSeats 应用当前的 filterIndex
        this.fetchSeats()
    },

    // 获取座位数据
    fetchSeats: function () {
        wx.showLoading({
            title: '加载中...',
        })

        wx.cloud.callFunction({
            name: 'getSeats',
            success: res => {
                // 隐藏加载提示框
                wx.hideLoading()
                if (res.result.code === 0) {
                    const seats = res.result.data.map(seat => {
                        // 确保数据结构包含所需字段
                        if (!seat.seatNumber || !seat.seatArea || !seat.type || !seat.status) {
                            console.error('座位数据缺少必要字段', seat)
                            return null
                        }

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

                        // 验证座位类型
                        const validTypes = ['半沉浸', '沉浸桌', '侧进式']
                        if (!validTypes.includes(seat.type)) {
                            seat.type = '未知类型'
                        }

                        return {
                            seatNumber: seat.seatNumber,
                            seatArea: seat.seatArea,
                            type: seat.type,
                            status: seat.status,
                            statusText,
                            ...seat
                        }
                    })

                    // 更新座位数据
                    this.setData({
                        seats: seats,
                        filteredSeats: seats
                    })

                    // 应用筛选
                    this.filterSeats()

                    // // 生成座位地图
                    // this.generateSeatMap()
                } else {
                    wx.showToast({
                        title: res.result.message || '获取座位失败',
                        icon: 'none'
                    })
                }
            },
            fail: err => {
                // 隐藏加载提示框
                wx.hideLoading()
                console.error('获取座位失败', err)
                wx.showToast({
                    title: '获取座位失败，请稍后再试',
                    icon: 'none'
                })
            }
        })
    },


    // 搜索输入
    onSearchInput: function (e) {
        this.setData({
            searchText: e.detail.value
        })

        // 清除之前的定时器
        if (this.searchTimer) {
            clearTimeout(this.searchTimer);
        }

        // 设置200ms延迟执行筛选
        this.searchTimer = setTimeout(() => {
            this.filterSeats();
        }, 200);
    },



    // 筛选变化
    onFilterChange: function (e) {
        this.setData({
            filterIndex: e.detail.value
        })

        this.filterSeats()
    },

    // 筛选座位
    filterSeats: function () {
        const { seats, searchText, filterIndex } = this.data

        let filteredSeats = [...seats]

        // 应用搜索
        if (searchText && searchText.trim()) {
            filteredSeats = filteredSeats.filter(seat => {
                return seat.seatNumber.toLowerCase().includes(searchText.trim().toLowerCase())
            })
        }

        // 应用状态筛选
        if (filterIndex > 0) {
            const statusMap = {
                1: 'available',  // 空闲
                2: 'reserved',   // 已预订
                3: 'occupied'    // 已占用
            }

            const targetStatus = statusMap[filterIndex]
            if (targetStatus) {
                filteredSeats = filteredSeats.filter(seat => seat.status === targetStatus)
            }
        }

        this.setData({
            filteredSeats
        })

        // 关闭所有自动显示的座位详情
        this.closeSeatDetail()
    },

    // 点击座位
    onSeatTap: function (e) {
        const seat = e.currentTarget.dataset.seat
        if (!seat) return

        this.showSeatDetail(seat)
    },

    // 点击座位列表项
    onSeatItemTap: function (e) {
        const seat = e.currentTarget.dataset.seat
        if (!seat) return

        this.showSeatDetail(seat)
    },

    // 显示座位详情
    showSeatDetail: function (seat) {
        this.setData({
            selectedSeat: seat,
            showSeatDetail: true
        })
    },

    // 关闭座位详情
    closeSeatDetail: function () {
        this.setData({
            showSeatDetail: false
        })
    },

    // 预订座位
    reserveSeat: function () {
        const { selectedSeat } = this.data
        if (!selectedSeat) return

        // 只有空闲的座位可以预订
        if (selectedSeat.status !== 'available') {
            wx.showToast({
                title: '只能预订空闲座位',
                icon: 'none'
            })
            return
        }

        wx.navigateTo({
            url: `/pages/reserve/reserve?seatId=${selectedSeat._id}`,
        })
    },

    // 管理座位
    manageSeat: function () {
        const { selectedSeat } = this.data
        if (!selectedSeat) return

        wx.navigateTo({
            url: `/pages/admin/seat-edit/seat-edit?seatId=${selectedSeat._id}`,
        })
    },


})