import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, X, Crown, User } from 'lucide-react';
import { getLeaderboard, LeaderboardEntry } from '../services/firebase';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScore?: number;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose, currentScore }) => {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getLeaderboard(20).then(data => {
        setScores(data);
        setLoading(false);
      });
    }
  }, [isOpen]);

  const getRank = (score: number) => {
    // Simple estimation for demo purposes if not in top 20
    // In a real app, you'd query the count of scores higher than current
    const index = scores.findIndex(s => s.score <= score);
    if (index !== -1) return index + 1;
    return scores.length + 1; // Fallback
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Trophy className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Leaderboard</h2>
                  <p className="text-xs text-zinc-400">Top Snake Masters</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
                </div>
              ) : (
                <div className="space-y-1">
                  {scores.map((entry, index) => (
                    <div 
                      key={entry.id || index}
                      className={`flex items-center justify-between p-3 rounded-xl ${
                        index < 3 ? 'bg-zinc-800/50 border border-zinc-700/50' : 'hover:bg-zinc-800/30'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${
                          index === 0 ? 'bg-amber-500 text-black' :
                          index === 1 ? 'bg-zinc-400 text-black' :
                          index === 2 ? 'bg-amber-700 text-white' :
                          'bg-zinc-800 text-zinc-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex flex-col">
                          <span className={`font-medium ${index === 0 ? 'text-amber-500' : 'text-zinc-200'}`}>
                            {entry.name}
                          </span>
                          <span className="text-xs text-zinc-500">
                            Mass: {Math.round(entry.mass)}
                          </span>
                        </div>
                      </div>
                      <div className="font-mono font-bold text-zinc-300">
                        {entry.score.toLocaleString()}
                      </div>
                    </div>
                  ))}
                  
                  {scores.length === 0 && (
                    <div className="text-center py-8 text-zinc-500">
                      No scores yet. Be the first!
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {currentScore !== undefined && currentScore > 0 && (
              <div className="p-4 bg-zinc-800/50 border-t border-zinc-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Your Current Rank</span>
                  <span className="text-amber-500 font-bold">#{getRank(currentScore)}</span>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
