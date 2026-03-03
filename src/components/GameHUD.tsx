import React from 'react';
import { Trophy, Zap } from 'lucide-react';
import { Joystick } from './Joystick';
import { Snake } from '../game/types';

interface GameHUDProps {
  score: number;
  rank: number;
  totalPlayers: number;
  snakes: Snake[];
  onExit: () => void;
  onJoystickMove: (angle: number | null, strength: number) => void;
  onBoostStart: () => void;
  onBoostEnd: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({ 
  score, rank, totalPlayers, snakes, onExit, onJoystickMove, onBoostStart, onBoostEnd 
}) => {
  return (
    <>
      {/* Score & Rank */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <div className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10">
          <div className="text-xs text-zinc-400 uppercase tracking-wider font-bold">Score</div>
          <div className="text-2xl font-mono font-bold text-amber-500">{score.toLocaleString()}</div>
        </div>
        <div className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10">
          <div className="text-xs text-zinc-400 uppercase tracking-wider font-bold">Rank</div>
          <div className="text-xl font-mono font-bold text-white">#{rank} <span className="text-sm text-zinc-500">/ {totalPlayers}</span></div>
        </div>
      </div>

      {/* In-Game Leaderboard */}
      <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 w-48">
         <div className="text-xs text-zinc-400 uppercase tracking-wider font-bold mb-2 flex items-center gap-2">
           <Trophy className="w-3 h-3 text-amber-500" /> Leaderboard
         </div>
         <div className="space-y-1">
           {snakes
             .filter(s => s && !s.dead)
             .sort((a, b) => (b?.score || 0) - (a?.score || 0))
             .slice(0, 10)
             .map((s, i) => (
               <div key={s?.id || i} className={`flex justify-between text-xs ${s?.id === 'player' ? 'text-amber-500 font-bold' : 'text-zinc-300'}`}>
                 <span>{i+1}. {s?.name.slice(0, 10)}</span>
                 <span>{Math.floor(s?.score || 0)}</span>
               </div>
             ))}
         </div>
      </div>

      {/* Mobile Controls */}
      <div className="absolute inset-0 md:hidden z-10">
        <Joystick onMove={onJoystickMove} />
      </div>
      
      {/* Exit Button */}
      <button 
        onClick={onExit}
        className="absolute bottom-8 left-8 bg-red-900/80 hover:bg-red-800 text-white font-bold p-4 rounded-full shadow-lg active:scale-95 transition-transform z-20"
      >
        Exit
      </button>

      <button 
        className="absolute bottom-8 right-8 md:hidden w-20 h-20 bg-amber-500/80 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform z-20"
        onTouchStart={(e) => { e.stopPropagation(); onBoostStart(); }}
        onTouchEnd={(e) => { e.stopPropagation(); onBoostEnd(); }}
      >
        <Zap className="w-8 h-8 text-white fill-current pointer-events-none" />
      </button>
    </>
  );
};
