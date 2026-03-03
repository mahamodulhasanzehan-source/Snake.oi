import React, { useEffect, useRef } from 'react';

interface SnakePreviewProps {
  skin: string;
  pattern?: string[];
}

export const SnakePreview: React.FC<SnakePreviewProps> = ({ skin, pattern }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const skinPatterns: Record<string, string[]> = {
      'orange': ['#FF8C00', '#FFA500', '#FFD700'],
      'blue': ['#0000CD', '#4169E1', '#87CEFA'],
      'green': ['#006400', '#32CD32', '#ADFF2F'],
      'purple': ['#4B0082', '#8A2BE2', '#DDA0DD'],
      'red': ['#8B0000', '#FF0000', '#FF6347'],
      'rainbow': ['#FF0000', '#FFA500', '#FFFF00', '#008000', '#0000FF', '#4B0082', '#EE82EE'],
      'usa': ['#B22234', '#FFFFFF', '#3C3B6E'],
      'germany': ['#000000', '#DD0000', '#FFCE00'],
      'france': ['#0055A4', '#FFFFFF', '#EF4135'],
      'brazil': ['#009c3b', '#ffdf00', '#002776'],
      'matrix': ['#000000', '#00FF00', '#003300'],
      'ghost': ['#FFFFFF20', '#FFFFFF40', '#FFFFFF60'],
      'custom': pattern || ['#FFFFFF', '#AAAAAA']
    };

    const activePattern = skinPatterns[skin] || skinPatterns['orange'];
    let animationFrameId: number;
    let offset = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw a sine wave snake
      const points = [];
      const segmentCount = 40; // More segments for smoother look
      const width = canvas.width;
      const height = canvas.height;
      const amplitude = 10;
      const frequency = 0.05;
      const spacing = 5; // Closer spacing
      
      for (let i = 0; i < segmentCount; i++) {
        // Center the snake
        const x = (width / 2) + ((segmentCount/2 - i) * spacing);
        const y = (height / 2) + Math.sin((i + offset) * frequency) * amplitude;
        points.push({ x, y });
      }

      const size = 24; // Snake width
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 1. Draw Shadow/Outline
      ctx.lineWidth = size + 4;
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();

      // 2. Draw Main Body
      ctx.lineWidth = size;
      ctx.strokeStyle = activePattern[0];
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();

      // 3. Draw Pattern
      if (activePattern.length > 1) {
        for (let i = 0; i < points.length - 1; i += 4) {
          const p1 = points[i];
          const p2 = points[i+1];
          const colorIndex = Math.floor(i / 8) % activePattern.length;
          const patternColor = activePattern[colorIndex];
          
          if (patternColor !== activePattern[0]) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineWidth = size * 0.8;
            ctx.strokeStyle = patternColor;
            ctx.stroke();
          }
        }
      }

      // 4. Draw Head
      const head = points[0];
      const next = points[1];
      const angle = Math.atan2(head.y - next.y, head.x - next.x);
      
      ctx.fillStyle = 'white';
      const eyeOffset = size / 3;
      const eyeSize = size / 3.5;
      
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

      offset += 0.2; // Slower wiggle
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [skin, pattern]);

  return <canvas ref={canvasRef} width={384} height={160} className="w-full h-full object-contain" />;
};
