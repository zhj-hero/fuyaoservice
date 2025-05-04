// pages/seat/seat.js
const app = getApp()

Page({
    data: {
        isAdmin: false,
        seats: [],
        filteredSeats: [],
        searchText: '',
        filterOptions: ['全部', '空闲', '已占用'],
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

        // 获取座位数据
        this.fetchSeats()
    },

    onShow: function () {
        // 每次显示页面时刷新数据
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

    // // 生成座位地图
    // generateSeatMap: function () {
    //     const { seats } = this.data
    //     if (!seats.length) return

    //     // 获取最大行列数
    //     let maxRow = 0
    //     let maxCol = 0

    //     seats.forEach(seat => {
    //         if (seat.row > maxRow) maxRow = seat.row
    //         if (seat.column > maxCol) maxCol = seat.column
    //     })

    //     // 初始化座位地图
    //     const seatMap = []
    //     for (let i = 0; i < maxRow; i++) {
    //         const row = []
    //         for (let j = 0; j < maxCol; j++) {
    //             row.push(null)
    //         }
    //         seatMap.push(row)
    //     }

    //     // 填充座位数据
    //     seats.forEach(seat => {
    //         if (seat.row > 0 && seat.column > 0) {
    //             seatMap[seat.row - 1][seat.column - 1] = seat
    //         }
    //     })

    //     this.setData({
    //         seatMap
    //     })
    // },

    // 搜索输入
    onSearchInput: function (e) {
        this.setData({
            searchText: e.detail.value
        })
    },

    // 搜索按钮点击事件
    onSearchTap: function () {
        this.filterSeats();
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
                2: 'occupied'   // 已占用
            }

            const targetStatus = statusMap[filterIndex]
            if (targetStatus) {
                filteredSeats = filteredSeats.filter(seat => seat.status === targetStatus)
            }
        }

        this.setData({
            filteredSeats
        })

        // 自动显示匹配的座位详情
        if (filteredSeats.length === 1) {
            this.showSeatDetail(filteredSeats[0])
        } else if (filteredSeats.length > 1 && searchText && searchText.trim()) {
            // 如果有多个匹配结果且是搜索操作，显示第一个匹配结果
            this.showSeatDetail(filteredSeats[0])
        } else {
            // 无匹配结果时关闭详情
            this.closeSeatDetail()
        }
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
    bookSeat: function () {
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
            url: `/pages/booking/booking?seatId=${selectedSeat.seatNumber}`,
        })
    },

    // 管理座位
    manageSeat: function () {
        const { selectedSeat } = this.data
        if (!selectedSeat) return

        wx.navigateTo({
            url: `/pages/admin/seat-edit?seatId=${selectedSeat._id}`,
        })
    },

    // 跳转到添加座位页面
    navigateToAddSeat: function () {
        wx.navigateTo({
            url: '/pages/admin/seat-add',
        })
    }
})