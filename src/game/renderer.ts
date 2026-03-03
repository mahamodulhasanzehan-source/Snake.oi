import { Snake, Food, Particle } from './types';
import { MAP_RADIUS, FOOD_GLOW } from './constants';
import { lightenColor } from './utils';

export const drawGrid = (ctx: CanvasRenderingContext2D, camera: {x: number, y: number, zoom: number}, canvasWidth: number, canvasHeight: number) => {
    const gridSize = 100;
    const viewportWidth = canvasWidth / camera.zoom;
    const viewportHeight = canvasHeight / camera.zoom;
    
    const startX = Math.floor((camera.x - viewportWidth/2) / gridSize) * gridSize;
    const endX = startX + viewportWidth + gridSize;
    const startY = Math.floor((camera.y - viewportHeight/2) / gridSize) * gridSize;
    const endY = startY + viewportHeight + gridSize;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    for (let x = startX; x < endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y < endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();
};

export const drawCrown = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, width: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.translate(0, -width);
    
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(-15, -20);
    ctx.lineTo(-5, -10);
    ctx.lineTo(0, -25);
    ctx.lineTo(5, -10);
    ctx.lineTo(15, -20);
    ctx.lineTo(15, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
};

export const drawSnake = (ctx: CanvasRenderingContext2D, snake: Snake) => {
    if (snake.segments.length < 2) return;

    // Draw from tail to head
    for (let i = snake.segments.length - 1; i >= 0; i--) {
        const seg = snake.segments[i];
        const isHead = i === 0;
        
        const colorIndex = Math.floor(i / 4) % snake.pattern.length;
        const baseColor = snake.pattern[colorIndex];

        // Create a radial gradient for each segment to make it look spherical
        const gradient = ctx.createRadialGradient(
            seg.x, seg.y, snake.width * 0.1, 
            seg.x, seg.y, snake.width * 0.5
        );
        
        if (snake.isBoosting) {
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(0.4, baseColor);
            gradient.addColorStop(1, darkenColor(baseColor, 30));
        } else {
            gradient.addColorStop(0, lightenColor(baseColor, 30));
            gradient.addColorStop(0.5, baseColor);
            gradient.addColorStop(1, darkenColor(baseColor, 40));
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, snake.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw Eyes on Head
        if (isHead) {
            const angle = snake.angle;
            
            ctx.fillStyle = 'white';
            const eyeOffset = snake.width * 0.35;
            const eyeSize = snake.width * 0.25;
            
            const leftEyeX = seg.x + Math.cos(angle - 0.6) * eyeOffset;
            const leftEyeY = seg.y + Math.sin(angle - 0.6) * eyeOffset;
            const rightEyeX = seg.x + Math.cos(angle + 0.6) * eyeOffset;
            const rightEyeY = seg.y + Math.sin(angle + 0.6) * eyeOffset;
            
            // Draw white of eyes
            ctx.beginPath(); ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI*2); ctx.fill();
            
            // Draw pupils
            ctx.fillStyle = 'black';
            const pupilOffset = eyeSize * 0.4;
            const lookX = Math.cos(angle) * pupilOffset;
            const lookY = Math.sin(angle) * pupilOffset;
            
            ctx.beginPath(); ctx.arc(leftEyeX + lookX, leftEyeY + lookY, eyeSize * 0.45, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(rightEyeX + lookX, rightEyeY + lookY, eyeSize * 0.45, 0, Math.PI*2); ctx.fill();
        }
    }

    if (snake.id === 'player' || snake.name === 'THE_BOSS') {
      drawCrown(ctx, snake.segments[0].x, snake.segments[0].y, snake.angle, snake.width);
    }
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.fillText(snake.name, snake.segments[0].x, snake.segments[0].y - snake.width - 15);
    ctx.shadowBlur = 0;
};

export const drawFood = (ctx: CanvasRenderingContext2D, food: Food) => {
    ctx.shadowBlur = FOOD_GLOW;
    ctx.shadowColor = food.color;
    ctx.fillStyle = food.color;
    ctx.beginPath();
    ctx.arc(food.x, food.y, food.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
};

export const drawParticle = (ctx: CanvasRenderingContext2D, p: Particle) => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.life * 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
};

export const drawWorld = (ctx: CanvasRenderingContext2D, camera: {x: number, y: number, zoom: number}, canvasWidth: number, canvasHeight: number, food: Food[], snakes: Snake[], particles: Particle[]) => {
    // Clear
    ctx.fillStyle = '#0b0b0b';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Camera Transform
    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    // Draw Grid
    drawGrid(ctx, camera, canvasWidth, canvasHeight);

    // Draw Food
    food.forEach(f => drawFood(ctx, f));

    // Draw Snakes
    snakes.forEach(snake => {
      if (!snake) return;
      drawSnake(ctx, snake);
    });

    // Draw Particles
    particles.forEach(p => drawParticle(ctx, p));

    // Draw Boundary
    ctx.beginPath();
    ctx.arc(0, 0, MAP_RADIUS, 0, Math.PI * 2);
    ctx.lineWidth = 50;
    ctx.strokeStyle = '#330000';
    ctx.stroke();
    
    // Draw Danger Zone
    ctx.beginPath();
    ctx.arc(0, 0, MAP_RADIUS + 25, 0, Math.PI * 2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#FF0000';
    ctx.stroke();

    ctx.restore();
};
