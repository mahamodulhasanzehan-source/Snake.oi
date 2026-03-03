export interface Point { x: number; y: number; }
export interface Food { x: number; y: number; size: number; color: string; value: number; id: number; }
export interface Snake {
  id: string;
  x: number;
  y: number;
  angle: number;
  targetAngle: number;
  segments: Point[];
  path: Point[];
  length: number;
  width: number;
  color: string;
  isBoosting: boolean;
  name: string;
  isBot: boolean;
  dead: boolean;
  score: number;
  skin: string;
  pattern: string[];
}
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}
