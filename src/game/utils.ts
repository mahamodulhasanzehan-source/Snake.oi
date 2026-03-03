import { Point } from './types';
import { MAP_RADIUS } from './constants';

export const randomColor = () => {
  const colors = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF5', '#FFFF33'];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const randomPoint = (): Point => {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * (MAP_RADIUS - 100);
  return {
    x: Math.cos(angle) * r,
    y: Math.sin(angle) * r
  };
};

export const getDistance = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

export const lerpAngle = (start: number, end: number, t: number) => {
  const diff = end - start;
  const da = (diff + Math.PI) % (Math.PI * 2) - Math.PI;
  return start + da * t;
};

export const lightenColor = (color: string, percent: number) => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const B = ((num >> 8) & 0x00FF) + amt;
  const G = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (B<255?B<1?0:B:255)*0x100 + (G<255?G<1?0:G:255)).toString(16).slice(1);
};

export const darkenColor = (color: string, percent: number) => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const B = ((num >> 8) & 0x00FF) - amt;
  const G = (num & 0x0000FF) - amt;
  return '#' + (0x1000000 + (R>0?R:0)*0x10000 + (B>0?B:0)*0x100 + (G>0?G:0)).toString(16).slice(1);
};
