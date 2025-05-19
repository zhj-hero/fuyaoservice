// pages/seatmap/seatmap.js
Page({
    data: {
        scale: 1,
        offsetX: -1,
        offsetY: -11, // 调整offsetY使画布向上移动
        lastX: 0,
        lastY: 0,
        isMoving: false,
        lastDistance: 0,
        centerX: 200, // 画布中心点X坐标
        centerY: 150,  // 画布中心点Y坐标
        toiletIconPath: './maletoilet.svg', // 男厕所图标路径
        femaleToiletIconPath: './femaletoilet.svg', // 女厕所图标路径
        reciteRoomIconPath: './reciteroom.svg', // 背书室图标路径
        restroomIconPath: './restroom.svg', // 茶水间图标路径
        stairIconPath: './stair.svg', // 楼道图标路径
        // 座位状态数据：0-空闲(绿色)，1-已预订(黄色)，2-已占用(红色)
        seatStatus: {
            'C1': 0, // C1座位状态为已预订
            'C2': 0,
            'C3': 0,
            'C4': 0,
            'C5': 0,
            'C6': 0,
            'C7': 0,
            'C8': 0,
            'C9': 2,
            'A1': 0,
            'A2': 0,
            'A3': 0,
            'A4': 0,
            'A5': 0,
            'A6': 0,
            'A7': 0,
            'A8': 0,
            'A9': 0,
            'A10': 0,
            'A11': 0,
            'A12': 0,
            'A13': 0,
            'A14': 0,
            'A15': 0,
            'A16': 0,
            'D1': 0,
            'D2': 0,
            'D3': 0,
            'D4': 0,
            'D5': 0,
            'D6': 0,
            'D7': 0
        },
        currentSeat: '' // 当前选中的座位
    },
    onLoad: function () {
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

                    // 预加载图标资源
                    this.loadIcons().then(() => {
                        // 确保页面完全加载后再绘制画布
                        setTimeout(() => {
                            this.drawCanvas();
                        }, 500);
                    });
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
                        iconPath = './maletoilet.svg';
                        iconName = '男厕所';
                        break;
                    case 'female':
                        iconPath = './femaletoilet.svg';
                        iconName = '女厕所';
                        break;
                    case 'reciteRoom':
                        iconPath = './reciteroom.svg';
                        iconName = '背书室';
                        break;
                    case 'restroom':
                        iconPath = './restroom.svg';
                        iconName = '茶水间';
                        break;
                    case 'stair':
                        iconPath = './stair.svg';
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
        // 页面显示时重新绘制
        this.drawCanvas();
    },

    // 抽取绘图逻辑为单独函数，提高代码复用性
    drawCanvas: function () {
        if (!this.ctx) return;

        const ctx = this.ctx;
        const that = this;

        // 清除画布
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 保存初始状态
        ctx.save();
        // 先平移后缩放，修复变换顺序
        ctx.translate(this.data.offsetX, this.data.offsetY);
        ctx.scale(this.data.scale, this.data.scale);

        // 设置长方形样式
        ctx.strokeStyle = '#000000'; // 边框颜色
        ctx.lineWidth = 0.5; // 边框宽度

        // 绘制长方形(x, y, width, height)
        ctx.beginPath();
        ctx.rect(12, 25, 105, 115); // C区
        ctx.stroke();

        // 绘制C区座位按钮
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

        // 根据座位状态设置不同的填充颜色
        const statusColors = ['#4CAF50', '#FFC107', '#F44336']; // 绿色-空闲，黄色-已预订，红色-已占用

        // 绘制C区座位
        Object.keys(this.seatAreas).forEach(seatId => {
            const area = this.seatAreas[seatId];
            const status = this.data.seatStatus[seatId] || 0;

            ctx.beginPath();
            ctx.rect(area.x, area.y, area.width, area.height);
            ctx.stroke();

            // 根据状态填充颜色
            ctx.fillStyle = statusColors[status];
            ctx.fillRect(area.x + 1, area.y + 1, area.width - 2, area.height - 2);

            // 高亮显示当前选中的座位
            if (this.data.currentSeat === seatId) {
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.strokeRect(area.x, area.y, area.width, area.height);
                ctx.lineWidth = 0.5;
                ctx.strokeStyle = '#000000';
            }

            // 绘制座位编号
            ctx.fillStyle = '#000000';
            ctx.font = '10px sans-serif';

            // 根据座位ID设置文本位置
            let textX, textY;
            switch (seatId) {
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

            ctx.fillText(seatId, textX, textY);
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
        ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'].forEach(seatId => {
            const area = this.seatAreas[seatId];
            const status = this.data.seatStatus[seatId] || 0;

            ctx.beginPath();
            ctx.rect(area.x, area.y, area.width, area.height);
            ctx.stroke();

            // 根据状态填充颜色
            ctx.fillStyle = statusColors[status];
            ctx.fillRect(area.x + 1, area.y + 1, area.width - 2, area.height - 2);

            // 高亮显示当前选中的座位
            if (this.data.currentSeat === seatId) {
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.strokeRect(area.x, area.y, area.width, area.height);
                ctx.lineWidth = 0.5;
                ctx.strokeStyle = '#000000';
            }

            // 绘制座位编号
            ctx.fillStyle = '#000000';
            ctx.font = '10px sans-serif';

            let textX, textY;
            switch (seatId) {
                case 'D1': textX = 17; textY = 265; break;
                case 'D2': textX = 42; textY = 265; break;
                case 'D3': textX = 42; textY = 285; break;
                case 'D4': textX = 17; textY = 285; break;
                case 'D5': textX = 100; textY = 234; break;
                case 'D6': textX = 100; textY = 272; break;
                case 'D7': textX = 100; textY = 310; break;
            }
            ctx.fillText(seatId, textX, textY);
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
        ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12', 'A13', 'A14', 'A15', 'A16'].forEach(seatId => {
            const area = this.seatAreas[seatId];
            const status = this.data.seatStatus[seatId] || 0;

            ctx.beginPath();
            ctx.rect(area.x, area.y, area.width, area.height);
            ctx.stroke();

            // 根据状态填充颜色
            ctx.fillStyle = statusColors[status];
            ctx.fillRect(area.x + 1, area.y + 1, area.width - 2, area.height - 2);

            // 高亮显示当前选中的座位
            if (this.data.currentSeat === seatId) {
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.strokeRect(area.x, area.y, area.width, area.height);
                ctx.lineWidth = 0.5;
                ctx.strokeStyle = '#000000';
            }

            // 绘制座位编号
            ctx.fillStyle = '#000000';
            ctx.font = '10px sans-serif';

            let textX, textY;
            switch (seatId) {
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
            ctx.fillText(seatId, textX, textY);
        });

        // B区
        ctx.beginPath();
        ctx.rect(257, 25, 160, 115); // B区
        // 绘制B区座位按钮
        ctx.rect(327, 140, 25, 25); // B1
        ctx.rect(302, 140, 25, 25); // B2
        ctx.rect(327, 205, 25, 25); // B3
        ctx.rect(302, 205, 25, 25); // B4
        // ctx.rect(200, 295, 25, 30); // B5
        // ctx.rect(200, 265, 25, 30); // B6   
        // ctx.rect(200, 235, 25, 30); // B7
        // ctx.rect(200, 205, 25, 30); // B8
        // ctx.rect(175, 205, 25, 30); // B9   
        // ctx.rect(175, 235, 25, 30); // B10
        // ctx.rect(175, 265, 25, 30); // B11
        // ctx.rect(175, 295, 25, 30); // B12
        // ctx.rect(117, 295, 25, 30); // B13
        // ctx.rect(117, 265, 25, 30); // B14
        // ctx.rect(117, 235, 25, 30); // B15
        ctx.stroke();




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

            // 计算边界限制
            const canvasWidth = 500;
            const canvasHeight = 325;
            const maxOffsetX = (canvasWidth * (this.data.scale - 1)) / 2;
            const maxOffsetY = (canvasHeight * (this.data.scale - 1)) / 2;

            // 限制移动范围
            let newOffsetX = this.data.offsetX + deltaX;
            let newOffsetY = this.data.offsetY + deltaY;

            newOffsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, newOffsetX));
            newOffsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, newOffsetY));

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

        // 将点击坐标转换为画布坐标
        const canvasX = (x - this.data.offsetX) / this.data.scale;
        const canvasY = (y - this.data.offsetY) / this.data.scale;

        // 检查点击是否在座位区域内
        for (const seatId in this.seatAreas) {
            const area = this.seatAreas[seatId];
            if (canvasX >= area.x && canvasX <= area.x + area.width &&
                canvasY >= area.y && canvasY <= area.y + area.height) {

                // 更新当前选中的座位
                this.setData({
                    currentSeat: seatId
                });

                // 显示座位信息
                this.showSeatInfo(seatId);

                // 重绘画布以高亮显示选中的座位
                this.drawCanvas();
                return;
            }
        }
    },

    // 显示座位信息
    showSeatInfo: function (seatId) {
        const status = this.data.seatStatus[seatId];
        let statusText = '';

        switch (status) {
            case 0: statusText = '空闲'; break;
            case 1: statusText = '已预订'; break;
            case 2: statusText = '已占用'; break;
            default: statusText = '未知';
        }

        wx.showModal({
            title: '座位信息',
            content: `座位号: ${seatId}\n状态: ${statusText}`,
            showCancel: false
        });
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
    }
})