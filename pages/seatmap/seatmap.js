// pages/seatmap/seatmap.js
Page({
    data: {
        isAdmin: false,
        scale: 1,
        offsetX: -1,
        offsetY: -11, // 调整offsetY使画布向上移动
        lastX: 0,
        lastY: 0,
        isMoving: false,
        lastDistance: 0,
        centerX: 200, // 画布中心点X坐标
        centerY: 150,  // 画布中心点Y坐标
        toiletIconPath: '../../static/images/seatmapicons/maletoilet.svg', // 男厕所图标路径
        femaleToiletIconPath: '../../static/images/seatmapicons/femaletoilet.svg', // 女厕所图标路径
        reciteRoomIconPath: '../../static/images/seatmapicons/reciteroom.svg', // 背书室图标路径
        restroomIconPath: '../../static/images/seatmapicons/restroom.svg', // 茶水间图标路径
        stairIconPath: '../../static/images/seatmapicons/stair.svg', // 楼道图标路径
        isLoading: true, // 是否正在加载座位数据
        loadError: false, // 加载是否出错
        currentSeat: '', // 当前选中的座位
        showSeatModal: false, // 是否显示座位详情弹窗
        selectedSeat: {} // 当前选中的座位详情
    },
    onLoad: function () {
        // 检查管理员状态
        const app = getApp();
        this.setData({
            isAdmin: app.globalData.isAdmin
        });

        // 添加页面加载完成监听
        wx.nextTick(() => {
            const query = wx.createSelectorQuery();
            query.select('#myCanvas')
                .fields({ node: true, size: true })
                .exec((res) => {
                    // Canvas 对象
                    this.canvas = res[0].node;
                    // 渲染上下文
                    this.ctx = this.canvas.getContext('2d');

                    // 设置画布的宽高为实际显示大小
                    const windowInfo = wx.getWindowInfo();
                    const dpr = windowInfo.pixelRatio;
                    this.canvas.width = res[0].width * dpr;
                    this.canvas.height = res[0].height * dpr;
                    this.ctx.scale(dpr, dpr);

                    // 获取座位数据
                    this.fetchSeats();

                    // 预加载图标资源
                    this.loadIcons();
                });
        });
    },

    // 加载图标的辅助方法
    loadIcons: function () {
        const that = this;

        // 添加标志，用于判断是否为开发环境
        const isDev = false; // 设置为true时会显示错误日志，false则不显示

        // 创建加载单个图标的Promise函数
        const loadIcon = function (iconType) {
            return new Promise((resolve) => {
                let iconPath, iconName;

                switch (iconType) {
                    case 'male':
                        iconPath = '../../static/images/seatmapicons/maletoilet.svg';
                        iconName = '男厕所';
                        break;
                    case 'female':
                        iconPath = '../../static/images/seatmapicons/femaletoilet.svg';
                        iconName = '女厕所';
                        break;
                    case 'reciteRoom':
                        iconPath = '../../static/images/seatmapicons/reciteroom.svg';
                        iconName = '背书室';
                        break;
                    case 'restroom':
                        iconPath = '../../static/images/seatmapicons/restroom.svg';
                        iconName = '茶水间';
                        break;
                    case 'stair':
                        iconPath = '../../static/images/seatmapicons/stair.svg';
                        iconName = '楼道';
                        break;
                }

                // 直接使用固定路径，确保路径正确
                // console.log(`尝试加载图标: ${iconName}, 路径: ${iconPath}`);

                // 使用FileSystemManager直接读取本地文件
                const fs = wx.getFileSystemManager();
                try {
                    // 尝试读取文件
                    fs.access({
                        path: iconPath,
                        success: function () {
                            // 文件存在，更新路径
                            const data = {};
                            switch (iconType) {
                                case 'male':
                                    data.toiletIconPath = iconPath;
                                    break;
                                case 'female':
                                    data.femaleToiletIconPath = iconPath;
                                    break;
                                case 'reciteRoom':
                                    data.reciteRoomIconPath = iconPath;
                                    break;
                                case 'restroom':
                                    data.restroomIconPath = iconPath;
                                    break;
                                case 'stair':
                                    data.stairIconPath = iconPath;
                                    break;
                            }
                            that.setData(data);
                            if (isDev) {
                                console.log(`成功访问图标文件: ${iconName}, 路径: ${iconPath}`);
                            }
                            resolve();
                        },
                        fail: function (err) {
                            // 文件不存在或无法访问
                            if (isDev) {
                                console.error(`访问${iconName}图标文件失败, 路径: ${iconPath}`, err);
                            }
                            // 尝试使用绝对路径
                            const absolutePath = `${wx.env.USER_DATA_PATH}/pages/seatmap/${iconPath.replace('./', '')}`;
                            // console.log(`尝试使用绝对路径: ${absolutePath}`);

                            // 设置为原始路径，让Canvas尝试加载
                            const data = {};
                            switch (iconType) {
                                case 'male':
                                    data.toiletIconPath = iconPath;
                                    break;
                                case 'female':
                                    data.femaleToiletIconPath = iconPath;
                                    break;
                                case 'reciteRoom':
                                    data.reciteRoomIconPath = iconPath;
                                    break;
                                case 'restroom':
                                    data.restroomIconPath = iconPath;
                                    break;
                                case 'stair':
                                    data.stairIconPath = iconPath;
                                    break;
                            }
                            that.setData(data);
                            resolve(); // 即使失败也继续执行
                        }
                    });
                } catch (err) {
                    if (isDev) {
                        console.error(`加载${iconName}图标失败, 路径: ${iconPath}`, err);
                    }
                    // 保留原始路径，让Canvas尝试加载
                    const data = {};
                    switch (iconType) {
                        case 'male':
                            data.toiletIconPath = iconPath;
                            break;
                        case 'female':
                            data.femaleToiletIconPath = iconPath;
                            break;
                        case 'reciteRoom':
                            data.reciteRoomIconPath = iconPath;
                            break;
                        case 'restroom':
                            data.restroomIconPath = iconPath;
                            break;
                        case 'stair':
                            data.stairIconPath = iconPath;
                            break;
                    }
                    that.setData(data);
                    resolve(); // 即使失败也继续执行
                }
            });
        };

        // 并行加载所有图标
        return Promise.all([
            loadIcon('male'),
            loadIcon('female'),
            loadIcon('reciteRoom'),
            loadIcon('restroom'),
            loadIcon('stair')
        ]);
    },
    onShow: function () {
        // 页面显示时重新获取座位状态并绘制
        this.fetchSeats();
        this.setData({
            showSeatModal: false
        });
    },

    // 获取所有座位状态
    fetchSeats: function () {
        // 显示加载中
        this.setData({
            isLoading: true,
            loadError: false
        });

        // 一次性获取所有座位状态
        wx.cloud.callFunction({
            name: 'getSeats',
            success: res => {
                if (res.result && res.result.code === 0) {
                    // 获取成功，处理返回的座位数据
                    const seats = res.result.data;
                    const seatStatus = {};
                    seats.forEach(seat => {
                        seatStatus[seat.seatNumber] = seat.status;
                    });
                    this.setData({
                        seatStatus: seatStatus,
                        isLoading: false
                    }, () => {
                        this.drawCanvas();
                    });

                } else {
                    this.setData({
                        isLoading: false,
                        loadError: true
                    }, () => {
                        // 即使出错也尝试绘制画布（使用默认状态）
                        this.drawCanvas();
                        // 显示错误提示
                        wx.showToast({
                            title: '获取座位状态失败',
                            icon: 'none',
                            duration: 2000
                        });
                    });
                }
            },
            fail: err => {
                console.error('调用获取座位云函数失败:', err);
                this.setData({
                    isLoading: false,
                    loadError: true
                }, () => {
                    // 即使出错也尝试绘制画布（使用默认状态）
                    this.drawCanvas();

                    // 显示错误提示
                    wx.showToast({
                        title: '获取座位状态失败',
                        icon: 'none',
                        duration: 2000
                    });
                });
            }
        });
    },

    // 绘制单个座位
    drawSeat: function (ctx, seatNumber, area, status) {
        const statusColors = {
            'available': '#e5e5e5', // 空闲
            'reserved': '#FFC107',   // 已预订
            'occupied': '#F44336'    // 已占用
        };

        ctx.beginPath();
        ctx.rect(area.x, area.y, area.width, area.height);
        ctx.stroke();

        // 根据状态填充颜色
        ctx.fillStyle = statusColors[status] || statusColors['available'];
        ctx.fillRect(area.x + 1, area.y + 1, area.width - 2, area.height - 2);

        // 高亮显示当前选中的座位
        if (this.data.currentSeat === seatNumber) {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.strokeRect(area.x, area.y, area.width, area.height);
            ctx.lineWidth = 0.5;
            ctx.strokeStyle = '#000000';
        }

        // 绘制座位编号
        ctx.fillStyle = '#000000';
        ctx.font = '10px sans-serif';

        let textX, textY;
        switch (seatNumber) {
            case 'B1': textX = 400; textY = 65; break;
            case 'B2': textX = 375; textY = 65; break;
            case 'B3': textX = 350; textY = 65; break;
            case 'B4': textX = 325; textY = 65; break;
            case 'B5': textX = 325; textY = 85; break;
            case 'B6': textX = 350; textY = 85; break;
            case 'B7': textX = 375; textY = 85; break;
            case 'B8': textX = 400; textY = 85; break;
            case 'B9': textX = 400; textY = 130; break;
            case 'B10': textX = 370; textY = 130; break;
            case 'B11': textX = 345; textY = 130; break;
            case 'B12': textX = 320; textY = 130; break;
            case 'B13': textX = 295; textY = 130; break;
            case 'B14': textX = 258; textY = 88; break;
            case 'B15': textX = 258; textY = 50; break;
        }
        ctx.fillText(seatNumber, textX, textY);
    },

    // 抽取绘图逻辑为单独函数，提高代码复用性
    drawCanvas: function () {
        if (!this.ctx) return;

        const ctx = this.ctx;
        const that = this;

        // 清除画布
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 如果正在加载数据，显示加载提示
        if (this.data.isLoading) {
            ctx.save();
            ctx.fillStyle = '#333333';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('正在加载座位数据...', this.canvas.width / 4, this.canvas.height / 4);
            ctx.restore();
        }

        // 如果加载出错，显示错误提示
        if (this.data.loadError) {
            ctx.save();
            ctx.fillStyle = '#FF0000';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('加载座位数据失败，显示默认状态', this.canvas.width / 4, this.canvas.height / 4 + 20);
            ctx.restore();
        }

        // 保存初始状态
        ctx.save();
        // 先平移后缩放，修复变换顺序
        ctx.translate(this.data.offsetX, this.data.offsetY);
        ctx.scale(this.data.scale, this.data.scale);

        // 设置长方形样式
        ctx.strokeStyle = '#000000'; // 边框颜色
        ctx.lineWidth = 0.5; // 边框宽度


        // 根据座位状态设置不同的填充颜色
        const statusColors = {
            'available': '#e5e5e5', // 空闲
            'reserved': '#FFC107',   // 已预订
            'occupied': '#F44336'    // 已占用
        };
        // 绘制C区座位按钮
        ctx.beginPath();
        ctx.rect(12, 25, 105, 115); // C区
        ctx.stroke();
        // 定义座位区域坐标，方便后续点击检测
        this.seatAreas = {
            'C1': { x: 12, y: 55, width: 25, height: 20 },
            'C2': { x: 37, y: 55, width: 25, height: 20 },
            'C3': { x: 37, y: 75, width: 25, height: 20 },
            'C4': { x: 12, y: 75, width: 25, height: 20 },
            'C5': { x: 12, y: 115, width: 25, height: 25 },
            'C6': { x: 37, y: 115, width: 25, height: 25 },
            'C7': { x: 62, y: 115, width: 25, height: 25 },
            'C8': { x: 97, y: 25, width: 20, height: 38 },
            'C9': { x: 97, y: 63, width: 20, height: 38 }
        };



        // 绘制C区座位
        Object.keys(this.seatAreas).forEach(seatNumber => {
            const area = this.seatAreas[seatNumber];
            const status = this.data.seatStatus[seatNumber] || 'available';

            ctx.beginPath();
            ctx.rect(area.x, area.y, area.width, area.height);
            ctx.stroke();

            // 根据状态填充颜色
            ctx.fillStyle = statusColors[status] || statusColors['available'];
            ctx.fillRect(area.x + 1, area.y + 1, area.width - 2, area.height - 2);

            // 高亮显示当前选中的座位
            if (this.data.currentSeat === seatNumber) {
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.strokeRect(area.x, area.y, area.width, area.height);
                ctx.lineWidth = 0.5;
                ctx.strokeStyle = '#000000';
            }

            // 绘制座位编号
            ctx.fillStyle = '#000000';
            ctx.font = '10px sans-serif';

            // 根据座位ID设置文本位置
            let textX, textY;
            switch (seatNumber) {
                case 'C1': textX = 17; textY = 70; break;
                case 'C2': textX = 42; textY = 70; break;
                case 'C3': textX = 42; textY = 90; break;
                case 'C4': textX = 17; textY = 90; break;
                case 'C5': textX = 19; textY = 135; break;
                case 'C6': textX = 44; textY = 135; break;
                case 'C7': textX = 69; textY = 135; break;
                case 'C8': textX = 100; textY = 50; break;
                case 'C9': textX = 100; textY = 88; break;
            }

            ctx.fillText(seatNumber, textX, textY);
        });

        // D区
        ctx.beginPath();
        ctx.rect(12, 210, 105, 115); // D区
        ctx.stroke();
        // 定义D区座位区域坐标
        this.seatAreas['D1'] = { x: 12, y: 250, width: 25, height: 20 };
        this.seatAreas['D2'] = { x: 37, y: 250, width: 25, height: 20 };
        this.seatAreas['D3'] = { x: 37, y: 270, width: 25, height: 20 };
        this.seatAreas['D4'] = { x: 12, y: 270, width: 25, height: 20 };
        this.seatAreas['D5'] = { x: 97, y: 210, width: 20, height: 39 };
        this.seatAreas['D6'] = { x: 97, y: 249, width: 20, height: 38 };
        this.seatAreas['D7'] = { x: 97, y: 287, width: 20, height: 38 };

        // 绘制D区座位
        ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'].forEach(seatNumber => {
            const area = this.seatAreas[seatNumber];
            const status = this.data.seatStatus[seatNumber] || 'available';

            ctx.beginPath();
            ctx.rect(area.x, area.y, area.width, area.height);
            ctx.stroke();

            // 根据状态填充颜色
            ctx.fillStyle = statusColors[status] || statusColors['available'];
            ctx.fillRect(area.x + 1, area.y + 1, area.width - 2, area.height - 2);

            // 高亮显示当前选中的座位
            if (this.data.currentSeat === seatNumber) {
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.strokeRect(area.x, area.y, area.width, area.height);
                ctx.lineWidth = 0.5;
                ctx.strokeStyle = '#000000';
            }

            // 绘制座位编号
            ctx.fillStyle = '#000000';
            ctx.font = '10px sans-serif';

            let textX, textY;
            switch (seatNumber) {
                case 'D1': textX = 17; textY = 265; break;
                case 'D2': textX = 42; textY = 265; break;
                case 'D3': textX = 42; textY = 285; break;
                case 'D4': textX = 17; textY = 285; break;
                case 'D5': textX = 100; textY = 234; break;
                case 'D6': textX = 100; textY = 272; break;
                case 'D7': textX = 100; textY = 310; break;
            }
            ctx.fillText(seatNumber, textX, textY);
        });

        // A区
        ctx.beginPath();
        ctx.rect(257, 25, 160, 115); // A区
        // 定义A区座位区域坐标
        this.seatAreas['A1'] = { x: 327, y: 140, width: 25, height: 25 };
        this.seatAreas['A2'] = { x: 302, y: 140, width: 25, height: 25 };
        this.seatAreas['A3'] = { x: 327, y: 205, width: 25, height: 25 };
        this.seatAreas['A4'] = { x: 302, y: 205, width: 25, height: 25 };
        this.seatAreas['A5'] = { x: 200, y: 295, width: 25, height: 30 };
        this.seatAreas['A6'] = { x: 200, y: 265, width: 25, height: 30 };
        this.seatAreas['A7'] = { x: 200, y: 235, width: 25, height: 30 };
        this.seatAreas['A8'] = { x: 200, y: 205, width: 25, height: 30 };
        this.seatAreas['A9'] = { x: 175, y: 205, width: 25, height: 30 };
        this.seatAreas['A10'] = { x: 175, y: 235, width: 25, height: 30 };
        this.seatAreas['A11'] = { x: 175, y: 265, width: 25, height: 30 };
        this.seatAreas['A12'] = { x: 175, y: 295, width: 25, height: 30 };
        this.seatAreas['A13'] = { x: 117, y: 295, width: 25, height: 30 };
        this.seatAreas['A14'] = { x: 117, y: 265, width: 25, height: 30 };
        this.seatAreas['A15'] = { x: 117, y: 235, width: 25, height: 30 };
        this.seatAreas['A16'] = { x: 117, y: 205, width: 25, height: 30 };

        // 绘制A区座位
        ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12', 'A13', 'A14', 'A15', 'A16'].forEach(seatNumber => {
            const area = this.seatAreas[seatNumber];
            const status = this.data.seatStatus[seatNumber] || 'available';

            ctx.beginPath();
            ctx.rect(area.x, area.y, area.width, area.height);
            ctx.stroke();

            // 根据状态填充颜色
            ctx.fillStyle = statusColors[status] || statusColors['available'];
            ctx.fillRect(area.x + 1, area.y + 1, area.width - 2, area.height - 2);

            // 高亮显示当前选中的座位
            if (this.data.currentSeat === seatNumber) {
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.strokeRect(area.x, area.y, area.width, area.height);
                ctx.lineWidth = 0.5;
                ctx.strokeStyle = '#000000';
            }

            // 绘制座位编号
            ctx.fillStyle = '#000000';
            ctx.font = '10px sans-serif';

            let textX, textY;
            switch (seatNumber) {
                case 'A1': textX = 332; textY = 155; break;
                case 'A2': textX = 307; textY = 155; break;
                case 'A3': textX = 332; textY = 220; break;
                case 'A4': textX = 307; textY = 220; break;
                case 'A5': textX = 205; textY = 315; break;
                case 'A6': textX = 205; textY = 285; break;
                case 'A7': textX = 205; textY = 255; break;
                case 'A8': textX = 205; textY = 225; break;
                case 'A9': textX = 181; textY = 225; break;
                case 'A10': textX = 179; textY = 255; break;
                case 'A11': textX = 179; textY = 285; break;
                case 'A12': textX = 179; textY = 315; break;
                case 'A13': textX = 120; textY = 315; break;
                case 'A14': textX = 120; textY = 285; break;
                case 'A15': textX = 120; textY = 255; break;
                case 'A16': textX = 120; textY = 225; break;
            }
            ctx.fillText(seatNumber, textX, textY);
        });

        // B区
        ctx.beginPath();
        ctx.rect(257, 25, 160, 115); // B区
        ctx.stroke();

        // 定义B区座位区域坐标
        this.seatAreas['B1'] = { x: 392, y: 50, width: 25, height: 20 };
        this.seatAreas['B2'] = { x: 367, y: 50, width: 25, height: 20 };
        this.seatAreas['B3'] = { x: 342, y: 50, width: 25, height: 20 };
        this.seatAreas['B4'] = { x: 317, y: 50, width: 25, height: 20 };
        this.seatAreas['B5'] = { x: 317, y: 70, width: 25, height: 20 };
        this.seatAreas['B6'] = { x: 342, y: 70, width: 25, height: 20 };
        this.seatAreas['B7'] = { x: 367, y: 70, width: 25, height: 20 };
        this.seatAreas['B8'] = { x: 392, y: 70, width: 25, height: 20 };
        this.seatAreas['B9'] = { x: 392, y: 115, width: 25, height: 25 };
        this.seatAreas['B10'] = { x: 367, y: 115, width: 25, height: 25 };
        this.seatAreas['B11'] = { x: 342, y: 115, width: 25, height: 25 };
        this.seatAreas['B12'] = { x: 317, y: 115, width: 25, height: 25 };
        this.seatAreas['B13'] = { x: 292, y: 115, width: 25, height: 25 };
        this.seatAreas['B14'] = { x: 257, y: 63, width: 20, height: 38 };
        this.seatAreas['B15'] = { x: 257, y: 25, width: 20, height: 38 };

        // 绘制B区座位
        ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11', 'B12', 'B13', 'B14', 'B15'].forEach(seatNumber => {
            const area = this.seatAreas[seatNumber];
            const status = this.data.seatStatus[seatNumber] || 'available';
            this.drawSeat(ctx, seatNumber, area, status);
        });

        ctx.rect(117, 25, 50, 55); // 男厕所
        ctx.rect(167, 25, 90, 115); // 背书室
        ctx.rect(12, 140, 50, 70); // 女厕所
        ctx.rect(352, 140, 65, 90); // 茶水间
        ctx.rect(257, 230, 160, 95); // 楼道
        ctx.stroke(); // 绘制边框

        // 绘制连接线
        ctx.beginPath();
        ctx.moveTo(117, 325);
        ctx.lineTo(257, 325);
        ctx.stroke(); // 绘制边框
        // 绘制连接线
        // 设置虚线样式
        ctx.setLineDash([3, 3]); // 5像素实线，3像素空白
        ctx.beginPath();
        ctx.moveTo(117, 140);
        ctx.lineTo(167, 140);
        ctx.stroke(); // 绘制虚线
        ctx.setLineDash([]); // 恢复默认实线样式

        // 添加文字标签
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#000000';

        const iconWidth = 20;
        const iconHeight = 20;

        // 直接绘制文字标签，确保即使图标加载失败也能显示文字
        const icons = [
            { path: that.data.toiletIconPath, x: 132, y: 35, text: '男厕所', textX: 127, textY: 70 },
            { path: that.data.femaleToiletIconPath, x: 27, y: 160, text: '女厕所', textX: 22, textY: 195 },
            { path: that.data.reciteRoomIconPath, x: 202, y: 65, text: '背书室', textX: 195, textY: 100 },
            { path: that.data.restroomIconPath, x: 377, y: 165, text: '茶水间', textX: 367, textY: 200 },
            { path: that.data.stairIconPath, x: 338, y: 255, text: '楼道', textX: 332, textY: 290 }
        ];

        // 先绘制所有文字，确保文字始终可见
        icons.forEach((icon) => {
            ctx.fillText(icon.text, icon.textX, icon.textY);
        });

        // 预加载所有图标，然后一次性绘制
        const preloadIcons = () => {
            const iconPromises = [];

            // 为每个图标创建加载Promise
            icons.forEach((icon) => {
                if (icon.path) {
                    const promise = new Promise((resolve) => {
                        try {
                            const img = that.canvas.createImage();
                            img.onload = () => {
                                // console.log(`图标加载成功: ${icon.text}`);
                                resolve({ img, ...icon });
                            };
                            img.onerror = (err) => {
                                console.error(`图标加载失败: ${icon.text}`, err);
                                resolve({ ...icon }); // 图标加载失败时仍然继续
                            };
                            // 确保路径正确
                            img.src = icon.path;
                            // console.log(`尝试加载图标: ${icon.text}, 路径: ${icon.path}`);
                        } catch (err) {
                            console.error(`创建图标对象失败: ${icon.text}`, err);
                            resolve({ ...icon });
                        }
                    });
                    iconPromises.push(promise);
                } else {
                    // 如果没有图标路径，只添加文本信息
                    iconPromises.push(Promise.resolve({ ...icon }));
                }
            });

            // 当所有图标加载完成后，一次性绘制
            Promise.all(iconPromises).then((loadedIcons) => {
                loadedIcons.forEach((icon) => {
                    // 绘制图标（如果加载成功）
                    if (icon.img) {
                        try {
                            ctx.drawImage(icon.img, icon.x, icon.y, iconWidth, iconHeight);
                        } catch (err) {
                            console.error(`绘制图标失败: ${icon.text}`, err);
                        }
                    }
                });

                // 在所有图标和文字绘制完成后恢复初始状态
                ctx.restore();
            }).catch(err => {
                console.error('图标加载过程中发生错误:', err);
                // 确保即使出错也恢复初始状态
                ctx.restore();
            });
        };

        // 执行图标预加载和绘制
        preloadIcons();
    },
    touchStart: function (e) {
        // 检测是单指还是双指操作
        if (e.touches.length === 1) {
            // 单指拖动
            this.setData({
                lastX: e.touches[0].clientX,
                lastY: e.touches[0].clientY,
                isMoving: true,
                lastDistance: 0 // 重置双指距离
            });
        } else if (e.touches.length === 2) {
            // 双指缩放 - 初始化距离
            const x1 = e.touches[0].clientX;
            const y1 = e.touches[0].clientY;
            const x2 = e.touches[1].clientX;
            const y2 = e.touches[1].clientY;

            // 计算两指之间的距离
            const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

            // 计算两指中心点，用于缩放中心
            const centerX = (x1 + x2) / 2;
            const centerY = (y1 + y2) / 2;

            this.setData({
                lastDistance: distance,
                centerX: centerX,
                centerY: centerY,
                isMoving: false
            });
        }
    },

    touchMove: function (e) {
        if (e.touches.length === 1 && this.data.scale > 1) {
            // 单指移动 - 仅在放大时允许移动
            const touch = e.touches[0];
            const deltaX = touch.clientX - this.data.lastX;
            const deltaY = touch.clientY - this.data.lastY;

            // 计算新偏移量
            let newOffsetX = this.data.offsetX + deltaX;
            let newOffsetY = this.data.offsetY + deltaY;

            this.setData({
                offsetX: newOffsetX,
                offsetY: newOffsetY,
                lastX: touch.clientX,
                lastY: touch.clientY
            });

            this.drawCanvas();
        } else if (e.touches.length === 2) {
            // 双指缩放
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.sqrt(
                Math.pow(touch1.clientX - touch2.clientX, 2) +
                Math.pow(touch1.clientY - touch2.clientY, 2)
            );

            if (this.data.lastDistance > 0) {
                const scale = this.data.scale * (distance / this.data.lastDistance);
                this.setData({
                    scale: Math.min(Math.max(scale, 1), 3),
                    lastDistance: distance
                });
                this.drawCanvas();
            }
            this.data.lastDistance = distance;
        }
    },

    touchEnd: function (e) {
        this.setData({
            isMoving: false
        });

        // 如果是单指触摸结束，检查是否点击了座位
        if (e.changedTouches && e.changedTouches.length === 1) {
            this.checkSeatClick(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        }
    },

    // 检查是否点击了座位
    checkSeatClick: function (x, y) {
        if (!this.seatAreas) return;

        // 添加y轴方向的偏移修正值，解决点击位置偏差问题
        const yCorrection = -100; // y轴修正值，根据实际情况调整

        // 将点击坐标转换为画布坐标，应用修正值
        const canvasX = (x - this.data.offsetX) / this.data.scale;
        const canvasY = (y - this.data.offsetY + yCorrection) / this.data.scale;

        // 开发环境下可以打开此注释查看坐标信息
        // console.log('点击坐标:', x, y, '转换后坐标:', canvasX, canvasY);

        // 增加点击检测范围，提高点击精度
        const clickTolerance = 5; // 点击容差值

        // 检查点击是否在座位区域内
        for (const seatNumber in this.seatAreas) {
            const area = this.seatAreas[seatNumber];
            if (canvasX >= (area.x - clickTolerance) &&
                canvasX <= (area.x + area.width + clickTolerance) &&
                canvasY >= (area.y - clickTolerance) &&
                canvasY <= (area.y + area.height + clickTolerance)) {

                // 更新当前选中的座位
                this.setData({
                    currentSeat: seatNumber
                });

                // 显示座位信息
                this.showSeatDetail(seatNumber);

                // 重绘画布以高亮显示选中的座位
                this.drawCanvas();
                return;
            }
        }
    },

    showSeatDetail: function (seatNumber) {
        wx.cloud.callFunction({
            name: 'getSeatByNumber',
            data: {
                seatNumber: seatNumber
            },
            success: res => {
                wx.hideLoading();
                if (res.result.code === 0) {
                    const seat = res.result.data;
                    this.setData({
                        selectedSeat: seat,
                        showSeatDetail: true
                    });
                } else {
                    wx.showToast({
                        title: res.result.message || '获取座位信息失败',
                        icon: 'none'
                    });
                }
            },
            fail: err => {
                wx.hideLoading();
                console.error('获取座位信息失败', err);
                wx.showToast({
                    title: '获取座位信息失败，请稍后再试',
                    icon: 'none'
                });
            }
        });
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
        this.setData({
            showSeatModal: false
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
    // 放大按钮事件处理
    zoomIn: function () {
        const newScale = Math.min(this.data.scale * 1.2, 3); // 增加20%，最大3倍
        this.setData({ scale: newScale });
        this.drawCanvas();
    },

    // 缩小按钮事件处理
    zoomOut: function () {
        const newScale = Math.max(this.data.scale * 0.8, 0.5); // 减少20%，最小0.5倍
        this.setData({ scale: newScale });
        this.drawCanvas();
    },

    // 重置按钮事件处理
    resetView: function () {
        this.setData({
            scale: 1,
            offsetX: -1,
            offsetY: -11
        });
        this.drawCanvas();
    },
})




