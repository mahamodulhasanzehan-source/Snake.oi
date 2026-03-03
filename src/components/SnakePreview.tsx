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

      // Helper to lighten/darken hex colors
      const lightenColor = (color: string, percent: number) => {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const B = ((num >> 8) & 0x00FF) + amt;
        const G = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (B<255?B<1?0:B:255)*0x100 + (G<255?G<1?0:G:255)).toString(16).slice(1);
      };
      
      const darkenColor = (color: string, percent: number) => {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const B = ((num >> 8) & 0x00FF) - amt;
        const G = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 + (R>0?R:0)*0x10000 + (B>0?B:0)*0x100 + (G>0?G:0)).toString(16).slice(1);
      };

      // Draw from tail to head
      for (let i = points.length - 1; i >= 0; i--) {
        const p = points[i];
        const isHead = i === 0;
        const size = 24; // Snake width
        
        const colorIndex = Math.floor(i / 4) % activePattern.length;
        const baseColor = activePattern[colorIndex];

        const gradient = ctx.createRadialGradient(p.x, p.y, size * 0.1, p.x, p.y, size * 0.5);
        gradient.addColorStop(0, lightenColor(baseColor, 30));
        gradient.addColorStop(0.5, baseColor);
        gradient.addColorStop(1, darkenColor(baseColor, 40));
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
        ctx.fill();

        if (isHead) {
          const next = points[1];
          const angle = Math.atan2(p.y - next.y, p.x - next.x);
          
          // Eyes
          ctx.fillStyle = 'white';
          const eyeOffset = size * 0.35;
          const eyeSize = size * 0.25;
          
          const leftEyeX = p.x + Math.cos(angle - 0.6) * eyeOffset;
          const leftEyeY = p.y + Math.sin(angle - 0.6) * eyeOffset;
          const rightEyeX = p.x + Math.cos(angle + 0.6) * eyeOffset;
          const rightEyeY = p.y + Math.sin(angle + 0.6) * eyeOffset;
          
          ctx.beginPath(); ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI*2); ctx.fill();
          
          ctx.fillStyle = 'black';
          const pupilOffset = eyeSize * 0.4;
          const lookX = Math.cos(angle) * pupilOffset;
          const lookY = Math.sin(angle) * pupilOffset;
          
          ctx.beginPath(); ctx.arc(leftEyeX + lookX, leftEyeY + lookY, eyeSize * 0.45, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(rightEyeX + lookX, rightEyeY + lookY, eyeSize * 0.45, 0, Math.PI*2); ctx.fill();
        }
      }

      offset += 0.2; // Slower wiggle
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [skin, pattern]);

  return <canvas ref={canvasRef} width={384} height={160} className="w-full h-full object-contain" />;
};
