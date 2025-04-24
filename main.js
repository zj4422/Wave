document.addEventListener('DOMContentLoaded', function() {
    console.log('全畫面波浪動畫已載入！');
    // 建立 canvas 元素並插入 body
    let canvas = document.getElementById('waveCanvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'waveCanvas';
        document.body.appendChild(canvas);
    }
    const ctx = canvas.getContext('2d');
    // 設定基本參數，使用隨機值
    let baseAmplitude = (97.5 + Math.random() * 39); // 改為 let 以便動態調整
    // 波形參數 - 使用隨機值初始化
    const waveParams = {
        frequency: (0.0013 + Math.random() * 0.00195), // 增加 30%
        phase: Math.random() * Math.PI * 2, // 隨機相位
        speed: 0.01 + Math.random() * 0.02, // 隨機速度
        horizontalSpeed: 1 + Math.random() * 0.5, // 水平移動速度 (每幀移動的像素數)
        floatSpeed: 0.0008 + Math.random() * 0.0004, // 飄浮速度
        floatAmplitude: 30 + Math.random() * 20 // 飄浮幅度
    };
    // 用於創建自然變化的多個波
    const subWaves = [
        { 
            frequency: waveParams.frequency * (0.325 + Math.random() * 0.13),
            amplitude: baseAmplitude * 0.195,
            speed: waveParams.speed * 0.7,
            phase: Math.random() * Math.PI * 2
        },
        { 
            frequency: waveParams.frequency * (0.975 + Math.random() * 0.195),
            amplitude: baseAmplitude * 0.0975,
            speed: waveParams.speed * 1.3,
            phase: Math.random() * Math.PI * 2
        }
    ];
    // 時間變數
    let time = Math.random() * 100; // 隨機的起始時間
    // 水平偏移量 - 用於實現右至左的移動
    let horizontalOffset = 0;
    // 儲存前一幀的波形，用於高比例平滑過渡
    let previousWavePoints = [];
    // 延伸參數 - 讓線條延伸到畫面外
    const extensionFactor = 0.3; // 每側延伸畫面寬度的30%
    let verticalCenter = canvas.height / 2; // 讓心電圖線條永遠位於畫面中心
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        verticalCenter = canvas.height / 2; // 每次視窗調整時也保持中心
        previousWavePoints = Array(Math.ceil(canvas.width * (1 + extensionFactor * 2))).fill(verticalCenter);
    }
    // 使用平滑曲線繪製波浪
    function drawSmoothWave(points) {
        if (points.length < 2) return;
        const startX = -canvas.width * extensionFactor;
        ctx.beginPath();
        ctx.moveTo(startX, points[0]);
        for (let i = 1; i < points.length; i++) {
            const x = startX + i;
            ctx.lineTo(x, points[i]);
        }
        ctx.stroke();
    }
    // 自然平滑波形函數 - 加入水平偏移
    function generateWavePoint(x, time, offset) {
        // 加入水平偏移，實現右至左移動
        const adjustedX = x + offset;
        // 主波
        let value = Math.sin(adjustedX * waveParams.frequency + time * waveParams.speed + waveParams.phase) * baseAmplitude;
        // 加入子波，創造更自然的波形
        for (const wave of subWaves) {
            value += Math.sin(adjustedX * wave.frequency + time * wave.speed + wave.phase) * wave.amplitude;
        }
        return value;
    }
    function drawWave() {
        // 增加時間（維持原本速度）
        time += 0.01; // 恢復原本速度
        // 增加水平偏移量，讓線條前進速度加快
        horizontalOffset += waveParams.horizontalSpeed * 5; // 水平移動速度為原本5倍
        // 計算垂直位置的緩慢自然變化 - 使用新的飄浮參數
        const verticalShift = Math.sin(time * waveParams.floatSpeed) * waveParams.floatAmplitude;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // 產生心電圖樣式的波形點
        const totalWidth = Math.ceil(canvas.width * (1 + extensionFactor * 2));
        const currentWavePoints = [];
        for (let i = 0; i < totalWidth; i++) {
            const x = i;
            let y = verticalCenter + verticalShift;
            // 控制心跳週期
            const minPeriod = 120; // 增大最小週期，讓心電圖不那麼密集
            const maxPeriod = 320; // 增大最大週期
            const period = baseAmplitude > 100 ? Math.max(maxPeriod - (baseAmplitude - 100) * 1.2, minPeriod) : maxPeriod;
            const spikeWidth = 16; // 增大尖峰寬度，讓特徵更寬鬆
            // 讓 spikeHeight 為 0 時線條完全平線，當 baseAmplitude <= 100 時為平線
            // 讓數值越大，線條跳動越激烈，數值越小越平靜
            // 震幅變化範圍 100~400
            // 200~400 的激烈度要和 100~200 一樣
            let dynamicAmp = 0;
            if (baseAmplitude > 100) {
                // 將 100~400 分成兩段，激烈度曲線一致
                let normAmp = (baseAmplitude - 100) / 300; // 0~1
                // 使用 S 曲線或分段線性，讓 100~200 和 200~400 激烈度一致
                if (baseAmplitude <= 200) {
                    dynamicAmp = Math.pow((baseAmplitude - 100) / 2.5, 1.35);
                } else {
                    // 200~400 區間，激烈度曲線與 100~200 相同
                    // 讓 200~400 的 dynamicAmp 增幅與 100~200 一致
                    dynamicAmp = Math.pow((baseAmplitude - 100) / 2.5 * 0.8 + 40, 1.35);
                }
            }
            let shake = 0;
            if (dynamicAmp > 0) {
                const shakeStrength = Math.min((baseAmplitude - 100) / 300, 1);
                shake = (
                    Math.sin(time * 3.2 + x * 0.028) * 18 * shakeStrength +
                    Math.sin(time * 1.7 + x * 0.022) * 12 * shakeStrength +
                    Math.cos(time * 2.5 + x * 0.045) * 8 * shakeStrength +
                    (Math.random() - 0.5) * 30 * shakeStrength +
                    Math.sin(time * 8.5 + x * 0.18) * 10 * shakeStrength +
                    Math.cos(time * 11.2 + x * 0.23) * 7 * shakeStrength +
                    (Math.random() > 0.995 ? (Math.random() - 0.5) * 120 : 0)
                );
                dynamicAmp += shake;
            }
            const spikeHeight = dynamicAmp;
            const t = (x + horizontalOffset) % period;
            // --- 心電圖主波 ---
            if (t > period * 0.18 && t < period * 0.22) {
                y -= spikeHeight * 0.18 * Math.sin(Math.PI * (t - period * 0.18) / (period * 0.04));
            } else if (t > period * 0.28 && t < period * 0.32) {
                y += spikeHeight * 0.25 * Math.sin(Math.PI * (t - period * 0.28) / (period * 0.04));
            } else if (t > period * 0.32 && t < period * 0.36) {
                y -= spikeHeight * 1.8 * Math.exp(-Math.pow((t - period * 0.34) / (period * 0.012), 2));
            } else if (t > period * 0.36 && t < period * 0.40) {
                y += spikeHeight * 0.5 * Math.sin(Math.PI * (t - period * 0.36) / (period * 0.04));
            } else if (t > period * 0.50 && t < period * 0.60) {
                y -= spikeHeight * 0.45 * Math.sin(Math.PI * (t - period * 0.50) / (period * 0.10));
            } else if (t > period * 0.65 && t < period * 0.70) {
                y -= spikeHeight * 0.10 * Math.sin(Math.PI * (t - period * 0.65) / (period * 0.05));
            }
            // --- 疊加彩色動態副波 ---
            // 彩色副波1
            y += Math.sin((x + horizontalOffset * 0.7) * 0.012 + time * 0.8) * (baseAmplitude * 0.18) * Math.sin(time * 0.7);
            // 彩色副波2
            y += Math.cos((x + horizontalOffset * 1.2) * 0.008 + time * 1.3) * (baseAmplitude * 0.12) * Math.cos(time * 0.5);
            // 彩色副波3
            y += Math.sin((x + horizontalOffset * 0.3) * 0.025 + time * 1.7) * (baseAmplitude * 0.08) * Math.sin(time * 1.1);
            // 平滑過渡
            if (previousWavePoints[i]) {
                y = previousWavePoints[i] * 0.80 + y * 0.20;
            }
            currentWavePoints[i] = y;
        }
        // --- 彩色線條 ---
        ctx.save();
        // 主心電圖螢光綠（放大）
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = '#39ff14';
        ctx.lineWidth = 3.5; // 主線加粗
        drawSmoothWave(currentWavePoints.map(y => (y - verticalCenter) * 1.5 + verticalCenter)); // 主線放大1.5倍
        // 疊加藍色副波（主線放大）
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = '#00eaff';
        ctx.lineWidth = 2.5;
        drawSmoothWave(currentWavePoints.map((y, i) => (y - verticalCenter) * 1.5 + verticalCenter + Math.sin((i + horizontalOffset * 0.5) * 0.01 + time * 0.6) * 18));
        // 疊加粉紅副波（主線放大）
        ctx.globalAlpha = 0.18;
        ctx.strokeStyle = '#ff3ecf';
        ctx.lineWidth = 3.5;
        drawSmoothWave(currentWavePoints.map((y, i) => (y - verticalCenter) * 1.5 + verticalCenter + Math.cos((i + horizontalOffset * 0.8) * 0.007 + time * 0.9) * 27));
        // --- 複製三條線到畫面其他地方交錯 ---
        // 複製偏移量陣列（可依需求調整）
        const offsets = [-canvas.height * 0.25, canvas.height * 0.25, -canvas.height * 0.4, canvas.height * 0.4];
        offsets.forEach((offsetY, idx) => {
            // 只對非中間主線做左右錯位與透明度降低
            // 中間主線（offsetY=0）不做錯位與透明度調整
            let xOffset = 0;
            let alphaScale = 0.5 * 0.7; // 透明度降為原本一半再降30%
            let phaseOffset = 0;
            let scale = 0.6; // 其他線條縮小
            if (offsetY !== 0) {
                // 左右錯位：偶數往右，奇數往左
                xOffset = (idx % 2 === 0 ? 1 : -1) * 60; // 可調整錯位像素
                // 擺動前後錯開：用不同的 phaseOffset 讓波形在時間軸上前後交錯
                phaseOffset = (idx % 2 === 0 ? 1 : -1) * Math.PI / 1.5 + idx * Math.PI / 4; // phaseOffset 加大且依序錯開
            } else {
                alphaScale = 1.0;
                scale = 1.5; // 主線放大
            }
            // 主線
            ctx.globalAlpha = 0.7 * alphaScale;
            ctx.strokeStyle = '#39ff14';
            ctx.lineWidth = 1.2;
            drawSmoothWave(currentWavePoints.map((y, i) => (y - verticalCenter) * scale + verticalCenter + offsetY + Math.sin((i + horizontalOffset * 0.5) * 0.01 + time * 0.6 + phaseOffset) * 7));
            // 藍色副波
            ctx.globalAlpha = 0.09 * alphaScale;
            ctx.strokeStyle = '#00eaff';
            ctx.lineWidth = 1.5;
            drawSmoothWave(currentWavePoints.map((y, i) => (y - verticalCenter) * scale + verticalCenter + Math.sin((i + horizontalOffset * 0.5 + xOffset) * 0.01 + time * 0.6 + phaseOffset) * 8 + offsetY));
            // 粉紅副波
            ctx.globalAlpha = 0.065 * alphaScale;
            ctx.strokeStyle = '#ff3ecf';
            ctx.lineWidth = 2;
            drawSmoothWave(currentWavePoints.map((y, i) => (y - verticalCenter) * scale + verticalCenter + Math.cos((i + horizontalOffset * 0.8 + xOffset) * 0.007 + time * 0.9 + phaseOffset) * 12 + offsetY));
        });
        ctx.restore();
        previousWavePoints = [...currentWavePoints];
        requestAnimationFrame(drawWave);
    }
    window.addEventListener('resize', function() {
        resizeCanvas();
    });
    resizeCanvas();
    // 取得滑桿元素與顯示值元素
    const amplitudeRange = document.getElementById('amplitudeRange');
    const amplitudeValue = document.getElementById('amplitudeValue');
    if (amplitudeRange && amplitudeValue) {
        amplitudeRange.value = Math.round(baseAmplitude);
        amplitudeValue.textContent = Math.round(baseAmplitude);
        amplitudeRange.addEventListener('input', function() {
            baseAmplitude = Number(this.value);
            amplitudeValue.textContent = this.value;
            // 同步更新子波振幅
            subWaves[0].amplitude = baseAmplitude * 0.195;
            subWaves[1].amplitude = baseAmplitude * 0.0975;
        });
    }
    // 新增 Web Serial 相關變數
let serialPort = null;
let serialReader = null;
let serialActive = false;

// 新增一個連接按鈕
const connectBtn = document.createElement('button');
connectBtn.textContent = '連接 Arduino';
connectBtn.style.position = 'fixed';
connectBtn.style.top = '50px';
connectBtn.style.left = '10px';
connectBtn.style.zIndex = 20;
connectBtn.style.background = '#4caf50';
connectBtn.style.color = '#fff';
connectBtn.style.border = 'none';
connectBtn.style.padding = '6px 16px';
connectBtn.style.borderRadius = '6px';
connectBtn.style.fontSize = '14px';
document.body.appendChild(connectBtn);

// 連接 Arduino 並讀取序列資料
connectBtn.addEventListener('click', async function() {
    if (!('serial' in navigator)) {
        alert('此瀏覽器不支援 Web Serial API，請用新版 Chrome/Edge！');
        return;
    }
    try {
        serialPort = await navigator.serial.requestPort();
        await serialPort.open({ baudRate: 9600 });
        serialReader = serialPort.readable.getReader();
        serialActive = true;
        connectBtn.textContent = '已連接';
        connectBtn.disabled = true;
        readSerialLoop();
    } catch (e) {
        alert('連接失敗：' + e);
    }
});

async function readSerialLoop() {
    let buffer = '';
    while (serialActive && serialReader) {
        try {
            const { value, done } = await serialReader.read();
            if (done) break;
            if (value) {
                buffer += new TextDecoder().decode(value);
                let lines = buffer.split('\n');
                buffer = lines.pop();
                for (let line of lines) {
                    let val = parseInt(line.trim());
                    if (!isNaN(val)) {
                        baseAmplitude = val;
                        if (amplitudeRange && amplitudeValue) {
                            amplitudeRange.value = val;
                            amplitudeValue.textContent = val;
                        }
                        // 同步更新子波振幅
                        subWaves[0].amplitude = baseAmplitude * 0.195;
                        subWaves[1].amplitude = baseAmplitude * 0.0975;
                    }
                }
            }
        } catch (e) {
            break;
        }
    }
}
    // 開始動畫循環
    requestAnimationFrame(drawWave);
});