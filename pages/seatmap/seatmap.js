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
        stairIconPath: './stair.svg' // 楼道图标路径
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
                    const dpr = wx.getSystemInfoSync().pixelRatio;
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
        ctx.rect(12, 55, 20, 20); // C1
        ctx.rect(32, 55, 20, 20); // C2
        ctx.rect(32, 75, 20, 20); // C3
        ctx.rect(12, 75, 20, 20); // C4
        ctx.rect(12, 120, 25, 20); // C5
        ctx.rect(37, 120, 25, 20); // C6
        ctx.rect(62, 120, 25, 20); // C7
        ctx.rect(97, 25, 20, 25); // C8
        ctx.rect(97, 50, 20, 25); // C9

        // 绘制C区座位编号
        ctx.font = '10px sans-serif';
        ctx.fillText('C1', 16, 70);
        ctx.fillText('C2', 36, 70);
        ctx.fillText('C4', 16, 90);
        ctx.fillText('C3', 36, 90);
        ctx.fillText('C5', 19, 135);
        ctx.fillText('C6', 44, 135);
        ctx.fillText('C7', 69, 135);
        ctx.fillText('C8', 100, 40);
        ctx.fillText('C9', 100, 65);

        ctx.stroke();



        ctx.rect(117, 25, 50, 55); // 男厕所
        ctx.rect(167, 25, 90, 115); // 背书室
        ctx.rect(257, 25, 160, 115); // A区
        ctx.rect(12, 140, 51, 70); // 女厕所
        ctx.rect(12, 210, 105, 115); // D区
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
            { path: that.data.stairIconPath, x: 337, y: 255, text: '楼道', textX: 332, textY: 290 }
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
        if (e.touches.length === 1 && this.data.isMoving) {
            // 单指拖动逻辑
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;

            // 计算偏移量，考虑当前缩放比例
            this.setData({
                offsetX: this.data.offsetX + (currentX - this.data.lastX) / this.data.scale,
                offsetY: this.data.offsetY + (currentY - this.data.lastY) / this.data.scale,
                lastX: currentX,
                lastY: currentY
            });

            // 重绘画布
            this.drawCanvas();
        } else if (e.touches.length === 2 && this.data.lastDistance > 0) {
            // 双指缩放逻辑
            const x1 = e.touches[0].clientX;
            const y1 = e.touches[0].clientY;
            const x2 = e.touches[1].clientX;
            const y2 = e.touches[1].clientY;

            // 计算新的两指距离
            const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

            // 计算新的缩放比例
            const newScale = this.data.scale * distance / this.data.lastDistance;
            const scale = Math.min(Math.max(newScale, 0.5), 3); // 限制缩放范围

            // 计算新的两指中心点
            const centerX = (x1 + x2) / 2;
            const centerY = (y1 + y2) / 2;

            // 更新状态
            this.setData({
                scale: scale,
                lastDistance: distance,
                centerX: centerX,
                centerY: centerY
            });

            // 重绘画布
            this.drawCanvas();
        }
    },

    touchEnd: function () {
        this.setData({
            isMoving: false
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
            offsetX: 0,
            offsetY: 0
        });
        this.drawCanvas();
    }
})