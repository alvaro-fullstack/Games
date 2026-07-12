const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreText = document.getElementById('score-text');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreText = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

// Fixed 720p resolution (reduced from 1080p to fit in Render's 512MB RAM limit during conversion)
const VIDEO_WIDTH = 720;
const VIDEO_HEIGHT = 1280;
// Vertical format like TikTok/Shorts based on the image functionality
// Wait, the image shows a square-ish or portrait video. 1080x1920 is standard for "shorts".
// But the user said "1080p". Usually means 1920x1080 (landscape) or 1080x1920 (portrait).
// Given "minijuego automatico" and the screenshot looks like TikTok (vertical), I'll go with Portrait 1080x1920.
// ACTUALLY, checking the image again... it looks 9:16.
canvas.width = VIDEO_WIDTH;
canvas.height = VIDEO_HEIGHT;

let width = VIDEO_WIDTH;
let height = VIDEO_HEIGHT;
let score = 0;
let isGameOver = false;

// Media Recorder variables
let mediaRecorder;
let recordedChunks = [];
let selectedMimeType = "";
const stream = canvas.captureStream(30); // 30 FPS (saves half the file size and RAM during conversion)

// Game constants (Scale them up for high res)
const GRAVITY = 0.4; // Slower gravity (was 0.8)
const BOUNCE_DAMPING = 0.8; // More dampening to slow it down (was 0.95)
const LEMON_ROTATION_SPEED = 0.02;
const MAX_VELOCITY = 15; // Cap speed to keep it trackable

// Assets
const likeIcon = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 55, // Scaled down for 720p (was 80 for 1080p)
    color: '#1877F2',
    draw: function () {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.fillStyle = 'white';
        // Scaled up thumbs up
        const s = 3; // Scale factor
        ctx.beginPath();
        ctx.moveTo(-5 * s, 0);
        ctx.lineTo(-5 * s, -10 * s);
        ctx.arc(-2 * s, -12 * s, 4 * s, Math.PI, 0);
        ctx.lineTo(2 * s, -5 * s);
        ctx.lineTo(10 * s, -5 * s);
        ctx.lineTo(10 * s, 8 * s);
        ctx.lineTo(-8 * s, 8 * s);
        ctx.lineTo(-8 * s, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    },
    update: function () {
        if (isGameOver) return;

        this.vy += GRAVITY;
        this.x += this.vx;
        this.y += this.vy;

        // Velocity capping
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > MAX_VELOCITY) {
            this.vx = (this.vx / speed) * MAX_VELOCITY;
            this.vy = (this.vy / speed) * MAX_VELOCITY;
        }

        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx *= -1;
        }
        if (this.x + this.radius > width) {
            this.x = width - this.radius;
            this.vx *= -1;
        }

        // Ceiling collision (Ceiling at y=0)
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.vy = Math.abs(this.vy) * 0.5; // Bounce down softly
        }

        if (this.y > height + 100) {
            endGame();
        }
    },
    reset: function () {
        this.x = width / 2;
        this.y = 200;
        this.vx = (Math.random() - 0.5) * 10; // Reduced initial speed (was 20)
        this.vy = 0;
    }
};

const lemons = [];
const lemonParticles = [];

class LemonPiece {
    constructor(x, y, vx, vy, color, size) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = 1.0;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.2;
    }

    update() {
        this.vy += GRAVITY * 0.5;
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotSpeed;
        this.life -= 0.02;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

class Lemon {
    constructor(x, y, radius, speed) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.angle = 0;
        this.speed = speed;
        this.holes = [];
    }

    addHole(globalX, globalY, holeRadius) {
        // Calculate coordinates relative to lemon center
        const dx = globalX - this.x;
        const dy = globalY - this.y;

        // Convert to local coordinates taking rotation into account
        const localX = dx * Math.cos(this.angle) + dy * Math.sin(this.angle);
        const localY = -dx * Math.sin(this.angle) + dy * Math.cos(this.angle);

        this.holes.push({ x: localX, y: localY, radius: holeRadius });
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#32CD32';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFE0';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.85, 0, Math.PI * 2);
        ctx.fillStyle = '#7CFC00';
        ctx.fill();

        ctx.strokeStyle = '#FFFFE0';
        ctx.lineWidth = 10; // Thicker lines for high res
        const segments = 8;
        for (let i = 0; i < segments; i++) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(this.radius * 0.85, 0);
            ctx.stroke();
            ctx.rotate(Math.PI * 2 / segments);
        }

        // Draw holes to simulate bites (matching the background color)
        ctx.fillStyle = '#111';
        // Use destination-out to literally erase the pixels on the canvas
        // This ensures they are transparent just like the background
        ctx.globalCompositeOperation = 'destination-out';
        for (const hole of this.holes) {
            ctx.beginPath();
            ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over'; // Reset to default

        ctx.restore();
    }

    update() {
        this.angle += this.speed;
    }
}

// Initial Setup
function setupCoordinates() {
    // Lemons positioned relative to fixed resolution
    lemons.length = 0;
    const lemonRadius = width * 0.45;
    const lemonY = height / 2 + 200;
    // Shift lemons outward by 35px each to create a tighter gap (~178px vs 160px ball)
    lemons.push(new Lemon(-35, lemonY, lemonRadius, LEMON_ROTATION_SPEED));
    lemons.push(new Lemon(width + 35, lemonY, lemonRadius, -LEMON_ROTATION_SPEED));
}

function checkCollision(ball, lemon) {
    if (isGameOver) return;

    const dx = ball.x - lemon.x;
    const dy = ball.y - lemon.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < ball.radius + lemon.radius) {
        const nx = dx / distance;
        const ny = dy / distance;
        const dvx = ball.vx;
        const dvy = ball.vy;
        const velAlongNormal = dvx * nx + dvy * ny;

        if (velAlongNormal > 0) return;

        const j = -(1 + BOUNCE_DAMPING) * velAlongNormal;

        // Tangent vector
        const tx = -ny;
        const ty = nx;
        const tangentVel = lemon.speed * lemon.radius;

        // Add bounce velocity, tangent (spin) velocity, and some random jitter
        ball.vx += j * nx + tx * tangentVel * 0.15 + (Math.random() - 0.5) * 4;
        ball.vy += j * ny + ty * tangentVel * 0.15 + (Math.random() - 0.5) * 4;

        const overlap = (ball.radius + lemon.radius) - distance;
        ball.x += nx * overlap;
        ball.y += ny * overlap;

        score += 10;
        scoreText.innerText = score.toLocaleString();

        const px = lemon.x + nx * lemon.radius;
        const py = lemon.y + ny * lemon.radius;

        // Add a hole matching the background to simulate a piece breaking off
        lemon.addHole(px, py, ball.radius * 0.6);

        // Spawn lemon pieces
        const colors = ['#32CD32', '#FFFFE0', '#7CFC00'];
        for (let i = 0; i < 15; i++) {
            // Scatter the pieces a bit based on collision normal
            const pvx = nx * (Math.random() * 8 + 3) + (Math.random() - 0.5) * 8;
            const pvy = ny * (Math.random() * 8 + 3) + (Math.random() - 0.5) * 8;

            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 20 + 10;
            lemonParticles.push(new LemonPiece(px, py, pvx, pvy, color, size));
        }

        // Upward boost (reduced for slower movement)
        ball.vy -= 8; // Smaller boost (was 15)
    }
}

function startRecording() {
    recordedChunks = [];
    showStatusMessage("🔴 Grabando gameplay...", 'rgba(255, 0, 0, 0.6)');

    const types = [
        'video/mp4;codecs=h264',
        'video/webm;codecs=h264',
        'video/webm;codecs=vp9',
        'video/webm'
    ];

    selectedMimeType = types.find(type => MediaRecorder.isTypeSupported(type)) || "";

    try {
        if (selectedMimeType) {
            mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMimeType });
            console.log("Recording with:", selectedMimeType);
        } else {
            mediaRecorder = new MediaRecorder(stream);
            console.log("Recording with default MIME type");
        }
    } catch (e) {
        console.error("MediaRecorder failed:", e);
        showStatusMessage("⚠️ Error: Grabación no soportada", 'rgba(255, 0, 0, 0.8)', 5000);
        return;
    }

    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = saveVideo;
    mediaRecorder.start();
    console.log("Recording started...");
}

function handleDataAvailable(event) {
    if (event.data.size > 0) {
        recordedChunks.push(event.data);
    }
}

function saveVideo() {
    const blob = new Blob(recordedChunks, {
        type: selectedMimeType || 'video/webm'
    });
    const url = URL.createObjectURL(blob);

    // Determine extension
    const extension = (selectedMimeType && selectedMimeType.includes('mp4')) ? 'mp4' : 'webm';
    const filename = `rebote_gameplay_${new Date().getTime()}.${extension}`;

    console.log("Intentando guardar el video en la carpeta 'videogame' a través del servidor local...");
    showStatusMessage("📤 Guardando video en la nube...", 'rgba(24, 119, 242, 0.8)');
    
    fetch('/upload', {
        method: 'POST',
        headers: {
            'X-Filename': filename,
            'Content-Type': blob.type
        },
        body: blob
    })
    .then(response => {
        if (response.ok) {
            console.log(`¡Video guardado directamente en la carpeta 'videogame' como: ${filename}!`);
            showStatusMessage("✅ ¡Guardado en la nube! Revisa tu Telegram.", 'rgba(50, 205, 50, 0.9)', 6000);
        } else {
            console.warn("El servidor no pudo guardar el archivo. Procediendo con descarga local tradicional.");
            showStatusMessage("⚠️ Falló subida. Guardando en descargas...", 'rgba(255, 140, 0, 0.9)', 5000);
            descargarLocalmente(url, filename);
        }
    })
    .catch(error => {
        console.warn("Servidor local no disponible o error de red. Procediendo con descarga local tradicional.");
        showStatusMessage("⚠️ Servidor desconectado. Guardando en descargas...", 'rgba(255, 140, 0, 0.9)', 5000);
        descargarLocalmente(url, filename);
    });
}

function descargarLocalmente(url, filename) {
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style = 'display: none';
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    console.log(`Video guardado en Descargas como: ${filename}`);
}

// Helper para mostrar mensajes de estado visuales en móviles (útil cuando la terminal no está visible)
function showStatusMessage(text, color = 'rgba(0, 0, 0, 0.7)', duration = 0) {
    let statusDiv = document.getElementById('upload-status-overlay');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'upload-status-overlay';
        statusDiv.style.position = 'fixed';
        statusDiv.style.bottom = '10%';
        statusDiv.style.left = '50%';
        statusDiv.style.transform = 'translateX(-50%)';
        statusDiv.style.padding = '16px 28px';
        statusDiv.style.borderRadius = '30px';
        statusDiv.style.color = 'white';
        statusDiv.style.fontFamily = 'Inter, sans-serif';
        statusDiv.style.fontWeight = 'bold';
        statusDiv.style.fontSize = '24px';
        statusDiv.style.zIndex = '10000';
        statusDiv.style.textAlign = 'center';
        statusDiv.style.boxShadow = '0 8px 24px rgba(0,0,0,0.6)';
        statusDiv.style.pointerEvents = 'none';
        statusDiv.style.transition = 'all 0.3s ease';
        document.body.appendChild(statusDiv);
    }
    statusDiv.style.backgroundColor = color;
    statusDiv.style.display = 'block';
    statusDiv.innerText = text;
    
    if (duration > 0) {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, duration);
    }
}

function endGame() {
    if (isGameOver) return;
    isGameOver = true;
    finalScoreText.innerText = score.toLocaleString();
    gameOverScreen.classList.remove('hidden');

    // Stop recording
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
}

function restartGame() {
    isGameOver = false;
    score = 0;
    scoreText.innerText = "0";
    gameOverScreen.classList.add('hidden');

    likeIcon.reset();

    // Start new recording
    startRecording();
}

restartBtn.addEventListener('click', restartGame);

// Drawing UI on canvas so it appears in video
function drawUI() {
    ctx.save();
    ctx.textAlign = 'center';

    // Score Text
    ctx.font = 'bold 35px Inter, sans-serif';
    const textPart1 = "This video will get ";
    const textPart2 = score.toLocaleString();
    const textPart3 = " likes";

    // Measure to center the whole block
    ctx.font = 'bold 35px Inter, sans-serif'; // Normal part
    const m1 = ctx.measureText(textPart1).width;
    const m3 = ctx.measureText(textPart3).width;
    ctx.font = '900 42px Inter, sans-serif'; // Score part
    const m2 = ctx.measureText(textPart2).width;

    const totalWidth = m1 + m2 + m3;
    let currentX = (width - totalWidth) / 2;
    const topY = 200; // Positioned proportionally from top (was 300)

    // Draw Part 1
    ctx.fillStyle = 'white';
    ctx.font = 'bold 35px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(textPart1, currentX, topY);
    currentX += m1;

    // Draw Score
    ctx.fillStyle = '#ffd700';
    ctx.font = '900 42px Inter, sans-serif';
    ctx.fillText(textPart2, currentX, topY);
    currentX += m2;

    // Draw Part 2
    ctx.fillStyle = 'white';
    ctx.font = 'bold 35px Inter, sans-serif';
    ctx.fillText(textPart3, currentX, topY);

    // Cap Text
    ctx.fillStyle = 'white';
    ctx.font = '500 50px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("Cap", width / 2, height / 2 - 80);

    ctx.restore();
}

function loop() {
    // Explicitly draw a solid background so the video doesn't have transparency
    ctx.fillStyle = '#000'; // Pure black background
    ctx.fillRect(0, 0, width, height);

    lemons.forEach(lemon => {
        lemon.update();
        lemon.draw();
        checkCollision(likeIcon, lemon);
    });

    likeIcon.update();
    likeIcon.draw();
    drawUI();

    // Update and draw particles
    for (let i = lemonParticles.length - 1; i >= 0; i--) {
        const p = lemonParticles[i];
        p.update();
        p.draw();
        if (p.life <= 0) {
            lemonParticles.splice(i, 1);
        }
    }

    requestAnimationFrame(loop);
}

// Init
setupCoordinates();
likeIcon.reset();
startRecording(); // Start recording immediately on load
loop();
