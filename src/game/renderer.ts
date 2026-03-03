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

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. Draw Shadow/Outline
    ctx.lineWidth = snake.width + 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.moveTo(snake.segments[0].x, snake.segments[0].y);
    for (let i = 1; i < snake.segments.length; i++) {
      ctx.lineTo(snake.segments[i].x, snake.segments[i].y);
    }
    ctx.stroke();

    // 2. Draw Main Body
    ctx.lineWidth = snake.width;
    ctx.strokeStyle = snake.color;
    
    if (snake.isBoosting) {
       const time = Date.now() / 100;
       ctx.strokeStyle = lightenColor(snake.color, Math.sin(time) * 30 + 30);
       ctx.shadowColor = snake.color;
       ctx.shadowBlur = 20;
    } else {
       ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    ctx.moveTo(snake.segments[0].x, snake.segments[0].y);
    for (let i = 1; i < snake.segments.length; i++) {
      ctx.lineTo(snake.segments[i].x, snake.segments[i].y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 3. Draw Pattern
    if (snake.pattern.length > 1) {
       for (let i = 0; i < snake.segments.length; i += 6) {
          const seg = snake.segments[i];
          const nextSeg = snake.segments[i+1];
          if (!nextSeg) continue;
          
          const colorIndex = Math.floor(i / 10) % snake.pattern.length;
          const patternColor = snake.pattern[colorIndex];
          
          if (patternColor !== snake.color) {
             ctx.beginPath();
             ctx.moveTo(seg.x, seg.y);
             ctx.lineTo(nextSeg.x, nextSeg.y);
             ctx.lineWidth = snake.width * 0.8;
             ctx.strokeStyle = patternColor;
             ctx.stroke();
          }
       }
    }

    // 4. Draw Head
    const head = snake.segments[0];
    const angle = snake.angle;
    
    ctx.fillStyle = 'white';
    const eyeOffset = snake.width / 3;
    const eyeSize = snake.width / 3.5;
    
    const leftEyeX = head.x + Math.cos(angle - 0.8) * eyeOffset * 1.5;
    const leftEyeY = head.y + Math.sin(angle - 0.8) * eyeOffset * 1.5;
    const rightEyeX = head.x + Math.cos(angle + 0.8) * eyeOffset * 1.5;
    const rightEyeY = head.y + Math.sin(angle + 0.8) * eyeOffset * 1.5;
    
    ctx.beginPath(); ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI*2); ctx.fill();
    
    ctx.fillStyle = 'black';
    const pupilOffset = eyeSize * 0.3;
    const lookX = Math.cos(angle) * pupilOffset;
    const lookY = Math.sin(angle) * pupilOffset;
    
    ctx.beginPath(); ctx.arc(leftEyeX + lookX, leftEyeY + lookY, eyeSize/2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(rightEyeX + lookX, rightEyeY + lookY, eyeSize/2, 0, Math.PI*2); ctx.fill();

    if (snake.id === 'player' || snake.name === 'THE_BOSS') {
      drawCrown(ctx, head.x, head.y, snake.angle, snake.width);
    }
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.fillText(snake.name, head.x, head.y - snake.width - 15);
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
