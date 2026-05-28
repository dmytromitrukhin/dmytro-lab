import './style.css';

const yearElement = document.querySelector('#year');

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

const canvas = document.querySelector('#hex-bg');
const context = canvas?.getContext('2d');

const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
).matches;

const pointerTrail = [];
let width = 0;
let height = 0;
let deviceRatio = 1;
let hexagons = [];
let animationFrameId = 0;
let lastPointerTime = 0;

function getHexRadius() {
    if (window.innerWidth < 520) {
        return 34;
    }

    if (window.innerWidth < 900) {
        return 40;
    }

    return 48;
}

function createHexagonPath(centerX, centerY, radius) {
    const points = [];

    for (let index = 0; index < 6; index += 1) {
        const angle = (Math.PI / 180) * (60 * index);

        points.push({
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
        });
    }

    return points;
}

function generateHexagons() {
    const radius = getHexRadius();
    const horizontalStep = radius * 1.5;
    const verticalStep = Math.sqrt(3) * radius;

    const columns = Math.ceil(width / horizontalStep) + 3;
    const rows = Math.ceil(height / verticalStep) + 3;
    const items = [];

    for (let column = -1; column < columns; column += 1) {
        for (let row = -1; row < rows; row += 1) {
            const centerX = column * horizontalStep;
            const centerY =
                row * verticalStep + (column % 2 === 0 ? 0 : verticalStep / 2);

            const gutter = 3;
            const drawRadius = Math.max(radius - gutter, 8);

            items.push({
                centerX,
                centerY,
                radius,
                points: createHexagonPath(centerX, centerY, drawRadius),
            });
        }
    }

    hexagons = items;
}

function resizeCanvas() {
    if (!canvas || !context) {
        return;
    }

    deviceRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.floor(width * deviceRatio);
    canvas.height = Math.floor(height * deviceRatio);

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    context.setTransform(deviceRatio, 0, 0, deviceRatio, 0, 0);

    generateHexagons();
    drawFrame();
}

function drawHexagon(points) {
    if (!context || points.length === 0) {
        return;
    }

    context.beginPath();
    context.moveTo(points[0].x, points[0].y);

    for (let index = 1; index < points.length; index += 1) {
        context.lineTo(points[index].x, points[index].y);
    }

    context.closePath();
    context.stroke();
}

function getPulseIntensity(centerX, centerY, now) {
    let intensity = 0;

    for (const point of pointerTrail) {
        const age = now - point.createdAt;
        const lifetime = 900;

        if (age > lifetime) {
            continue;
        }

        const distance = Math.hypot(centerX - point.x, centerY - point.y);
        const radius = 170;
        const distancePower = Math.max(0, 1 - distance / radius);
        const agePower = 1 - age / lifetime;

        intensity = Math.max(intensity, distancePower * agePower);
    }

    return intensity;
}

function clearOldTrailPoints(now) {
    for (let index = pointerTrail.length - 1; index >= 0; index -= 1) {
        if (now - pointerTrail[index].createdAt > 950) {
            pointerTrail.splice(index, 1);
        }
    }
}

function drawFrame() {
    if (!context) {
        return;
    }

    const now = performance.now();

    context.clearRect(0, 0, width, height);

    context.lineWidth = 2;

    for (const hexagon of hexagons) {
        const intensity = prefersReducedMotion
            ? 0
            : getPulseIntensity(hexagon.centerX, hexagon.centerY, now);

        if (intensity > 0.02) {
            context.shadowColor = `rgba(125, 211, 252, ${0.45 * intensity})`;
            context.shadowBlur = 18 * intensity;
            context.strokeStyle = `rgba(125, 211, 252, ${0.08 + 0.65 * intensity})`;
        } else {
            context.shadowBlur = 0;
            context.strokeStyle = 'rgba(148, 163, 184, 0.075)';
        }

        drawHexagon(hexagon.points);
    }

    context.shadowBlur = 0;

    clearOldTrailPoints(now);

    if (pointerTrail.length > 0 && !prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(drawFrame);
    } else {
        animationFrameId = 0;
    }
}

function addPointerPoint(clientX, clientY) {
    if (prefersReducedMotion) {
        return;
    }

    const now = performance.now();

    if (now - lastPointerTime < 24) {
        return;
    }

    lastPointerTime = now;

    pointerTrail.push({
        x: clientX,
        y: clientY,
        createdAt: now,
    });

    if (pointerTrail.length > 24) {
        pointerTrail.shift();
    }

    if (animationFrameId === 0) {
        animationFrameId = requestAnimationFrame(drawFrame);
    }
}

function handlePointerMove(event) {
    addPointerPoint(event.clientX, event.clientY);
}

function handleTouchMove(event) {
    const touch = event.touches[0];

    if (!touch) {
        return;
    }

    addPointerPoint(touch.clientX, touch.clientY);
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('pointerdown', handlePointerMove);
window.addEventListener('pointermove', handlePointerMove);
window.addEventListener('touchstart', handleTouchMove, { passive: true });
window.addEventListener('touchmove', handleTouchMove, { passive: true });

resizeCanvas();