import React, { useEffect, useRef, useState } from 'react';

interface JoystickProps {
  onMove: (angle: number | null, strength: number) => void;
  size?: number;
  baseColor?: string;
  stickColor?: string;
}

export const Joystick: React.FC<JoystickProps> = ({ 
  onMove, 
  size = 120, 
  baseColor = 'rgba(255, 255, 255, 0.15)', 
  stickColor = 'rgba(255, 255, 255, 0.4)' 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [center, setCenter] = useState<{ x: number, y: number } | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const touchId = useRef<number | null>(null);

  const radius = size / 2;
  const stickRadius = size / 4;
  const maxDistance = radius - stickRadius;

  const handleStart = (clientX: number, clientY: number) => {
    setCenter({ x: clientX, y: clientY });
    setPosition({ x: 0, y: 0 });
    setActive(true);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!active || !center) return;
    
    const dx = clientX - center.x;
    const dy = clientY - center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    const cappedDistance = Math.min(distance, maxDistance);
    const x = Math.cos(angle) * cappedDistance;
    const y = Math.sin(angle) * cappedDistance;
    
    setPosition({ x, y });
    onMove(angle, Math.min(distance / maxDistance, 1));
  };

  const handleEnd = () => {
    setActive(false);
    setCenter(null);
    setPosition({ x: 0, y: 0 });
    onMove(null, 0);
    touchId.current = null;
  };

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling
    if (active) return; // Already active
    const touch = e.changedTouches[0];
    touchId.current = touch.identifier;
    handleStart(touch.clientX, touch.clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!active) return;
    
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchId.current) {
        handleMove(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
        break;
      }
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchId.current) {
        handleEnd();
        break;
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 z-10 select-none touch-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      {active && center && (
        <div 
          className="absolute rounded-full pointer-events-none"
          style={{ 
            width: size, 
            height: size, 
            backgroundColor: baseColor,
            left: center.x - radius,
            top: center.y - radius,
            boxShadow: '0 0 20px rgba(0,0,0,0.2)'
          }}
        >
          <div 
            className="absolute rounded-full pointer-events-none"
            style={{
              width: stickRadius * 2,
              height: stickRadius * 2,
              backgroundColor: stickColor,
              left: '50%',
              top: '50%',
              marginLeft: -stickRadius,
              marginTop: -stickRadius,
              transform: `translate(${position.x}px, ${position.y}px)`,
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
            }}
          />
        </div>
      )}
    </div>
  );
};
