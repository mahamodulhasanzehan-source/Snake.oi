import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, User as UserIcon, Play, LogOut } from 'lucide-react';
import { SnakePreview } from './SnakePreview';
import { User } from 'firebase/auth';
import { getLeaderboard, LeaderboardEntry } from '../services/firebase';

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
}

export const GameMenu: React.FC<GameMenuProps> = ({
  user, playerName, setPlayerName, selectedSkin, setSelectedSkin, customPattern, setCustomPattern,
  showSkinSelector, setShowSkinSelector, onStartGame, onGoogleLogin, onSignOut
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const data = await getLeaderboard(10);
      setLeaderboard(data);
      setLoadingLeaderboard(false);
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10 p-8">
      <div className="flex w-full max-w-6xl gap-8 h-[80vh]">
        
        {/* LEFT PANEL - GAME CONTROLS */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex-1 bg-zinc-900/90 border border-zinc-700 p-8 rounded-3xl shadow-2xl flex flex-col items-center justify-center relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>

          <Crown className="w-16 h-16 text-amber-500 mb-4" />
          <h1 className="text-6xl font-black italic tracking-tighter mb-2">
            SNAKE<span className="text-amber-500">.OI</span>
          </h1>
          <p className="text-zinc-400 mb-8 text-xl">Slither, Eat, Conquer.</p>

          {/* Skin Preview */}
          <div className="mb-6 relative w-full h-48 bg-black/40 rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center group cursor-pointer" onClick={() => setShowSkinSelector(!showSkinSelector)}>
             <SnakePreview skin={selectedSkin} pattern={selectedSkin === 'custom' ? customPattern : undefined} />
             <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <span className="text-white font-bold bg-black/50 px-4 py-2 rounded-full">Change Skin</span>
             </div>
          </div>

          {/* Skin Selector */}
          <AnimatePresence>
             {showSkinSelector && (
               <motion.div 
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: 'auto', opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 className="mb-6 w-full overflow-hidden"
               >
                  <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
                    <div className="grid grid-cols-7 gap-2 mb-4">
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
                           }} className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent" />
                         ))}
                         {customPattern.length < 6 && <button onClick={() => setCustomPattern([...customPattern, '#FFF'])} className="w-8 h-8 bg-zinc-700 rounded text-xs flex items-center justify-center hover:bg-zinc-600 transition-colors">+</button>}
                         {customPattern.length > 2 && <button onClick={() => setCustomPattern(customPattern.slice(0, -1))} className="w-8 h-8 bg-red-900 rounded text-xs flex items-center justify-center hover:bg-red-800 transition-colors">-</button>}
                       </div>
                    )}
                  </div>
               </motion.div>
             )}
          </AnimatePresence>

          <div className="w-full space-y-4">
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

            <div className="flex gap-3">
              {user && !user.isAnonymous ? (
                <button 
                  onClick={onSignOut}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              ) : (
                <button 
                  onClick={onGoogleLogin}
                  className="flex-1 bg-white hover:bg-gray-100 text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="G" />
                  Sign in with Google
                </button>
              )}
            </div>

            <button 
              onClick={onStartGame}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold py-5 rounded-xl text-2xl shadow-lg shadow-orange-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <Play className="w-8 h-8 fill-current" />
              PLAY NOW
            </button>
          </div>
        </motion.div>

        {/* RIGHT PANEL - LEADERBOARD */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-96 bg-zinc-900/90 border border-zinc-700 p-0 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        >
          <div className="p-6 border-b border-zinc-800 bg-zinc-800/30">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-amber-500">
              <Crown className="w-6 h-6" />
              Leaderboard
            </h2>
            <p className="text-zinc-500 text-sm">Top players of all time</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {loadingLeaderboard ? (
              <div className="flex items-center justify-center h-40 text-zinc-500">Loading...</div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center text-zinc-500 py-8">No scores yet. Be the first!</div>
            ) : (
              leaderboard.map((entry, index) => {
                const isMe = user && entry.uid === user.uid;
                return (
                  <div 
                    key={entry.id || index}
                    className={`flex items-center justify-between p-3 rounded-xl border ${isMe ? 'bg-amber-500/10 border-amber-500/50' : 'bg-zinc-800/30 border-zinc-800'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500 text-black' :
                        index === 1 ? 'bg-zinc-400 text-black' :
                        index === 2 ? 'bg-orange-700 text-white' :
                        'bg-zinc-800 text-zinc-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className={`font-bold ${isMe ? 'text-amber-500' : 'text-zinc-200'}`}>
                          {entry.name}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {new Date(entry.timestamp?.seconds * 1000).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-zinc-300">
                      {entry.score.toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
};
