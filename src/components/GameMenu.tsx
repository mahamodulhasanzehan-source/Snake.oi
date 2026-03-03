import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, User as UserIcon, Play, Trophy } from 'lucide-react';
import { SnakePreview } from './SnakePreview';
import { User } from 'firebase/auth';

interface GameMenuProps {
  user: User | null;
  playerName: string;
  setPlayerName: (name: string) => void;
  selectedSkin: string;
  setSelectedSkin: (skin: string) => void;
  customPattern: string[];
  setCustomPattern: (pattern: string[]) => void;
  showSkinSelector: boolean;
  setShowSkinSelector: (show: boolean) => void;
  onStartGame: () => void;
  onGoogleLogin: () => void;
  onSignOut: () => void;
  onOpenLeaderboard: () => void;
}

export const GameMenu: React.FC<GameMenuProps> = ({
  user, playerName, setPlayerName, selectedSkin, setSelectedSkin, customPattern, setCustomPattern,
  showSkinSelector, setShowSkinSelector, onStartGame, onGoogleLogin, onSignOut, onOpenLeaderboard
}) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900/90 border border-zinc-700 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>

        <Crown className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h1 className="text-5xl font-black italic tracking-tighter mb-2">
          SNAKE<span className="text-amber-500">.OI</span>
        </h1>
        <p className="text-zinc-400 mb-8">Slither, Eat, Conquer.</p>

        {/* Skin Preview */}
        <div className="mb-6 relative h-40 bg-black/40 rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center">
           <SnakePreview skin={selectedSkin} pattern={selectedSkin === 'custom' ? customPattern : undefined} />
        </div>

        {/* Skin Selector */}
        <AnimatePresence>
           {showSkinSelector && (
             <motion.div 
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               exit={{ height: 0, opacity: 0 }}
               className="mb-6 overflow-hidden"
             >
                <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
                  <div className="grid grid-cols-6 gap-2 mb-4">
                    {['orange', 'blue', 'green', 'purple', 'red', 'rainbow', 'usa', 'germany', 'france', 'brazil', 'matrix', 'ghost', 'custom'].map(skin => (
                      <button
                        key={skin}
                        onClick={() => setSelectedSkin(skin)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${selectedSkin === skin ? 'border-amber-500 scale-110' : 'border-transparent'}`}
                        style={{ 
                          background: skin === 'rainbow' ? 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)' : 
                                      skin === 'usa' ? 'linear-gradient(to right, red, white, blue)' : 
                                      skin === 'germany' ? 'linear-gradient(to bottom, black, red, yellow)' :
                                      skin === 'france' ? 'linear-gradient(to right, blue, white, red)' :
                                      skin === 'brazil' ? 'linear-gradient(to right, green, yellow, blue)' :
                                      skin === 'matrix' ? 'black' :
                                      skin === 'ghost' ? '#333' :
                                      skin === 'custom' ? 'conic-gradient(from 0deg, red, yellow, green, blue, purple)' : skin 
                        }}
                      />
                    ))}
                  </div>
                  {selectedSkin === 'custom' && (
                     <div className="flex gap-1 justify-center">
                       {customPattern.map((c, i) => (
                         <input key={i} type="color" value={c} onChange={e => {
                           const n = [...customPattern]; n[i] = e.target.value; setCustomPattern(n);
                         }} className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent" />
                       ))}
                       {customPattern.length < 6 && <button onClick={() => setCustomPattern([...customPattern, '#FFF'])} className="w-6 h-6 bg-zinc-700 rounded text-xs flex items-center justify-center">+</button>}
                       {customPattern.length > 2 && <button onClick={() => setCustomPattern(customPattern.slice(0, -1))} className="w-6 h-6 bg-red-900 rounded text-xs flex items-center justify-center">-</button>}
                     </div>
                  )}
                </div>
             </motion.div>
           )}
        </AnimatePresence>

        <div className="space-y-4">
          <div className="relative">
            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Enter Nickname"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full bg-black/50 border border-zinc-700 rounded-xl py-4 pl-12 pr-4 text-lg focus:outline-none focus:border-amber-500 transition-colors"
              maxLength={12}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
             <button 
              onClick={() => setShowSkinSelector(!showSkinSelector)}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <div className="w-3 h-3 rounded-full" style={{ background: selectedSkin === 'rainbow' ? 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)' : selectedSkin }} />
              Change Skin
            </button>
            
            {user && !user.isAnonymous ? (
              <button 
                onClick={onSignOut}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                Sign Out
              </button>
            ) : (
              <button 
                onClick={onGoogleLogin}
                className="bg-white hover:bg-gray-100 text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="G" />
                Sign in with Google
              </button>
            )}
          </div>

          <button 
            onClick={onStartGame}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold py-4 rounded-xl text-xl shadow-lg shadow-orange-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Play className="w-6 h-6 fill-current" />
            PLAY NOW
          </button>
          
          <button 
            onClick={onOpenLeaderboard}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Trophy className="w-5 h-5" />
            View Leaderboard
          </button>
        </div>
      </motion.div>
    </div>
  );
};
