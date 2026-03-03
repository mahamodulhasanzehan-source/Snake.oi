import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play } from 'lucide-react';

interface ExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ExitModal: React.FC<ExitModalProps> = ({ isOpen, onClose, onConfirm }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-zinc-900 border border-zinc-700 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Exit Game?</h2>
          <p className="text-zinc-400 mb-8">Are you sure you want to quit the current game?</p>
          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              No
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Yes
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const SignOutModal: React.FC<SignOutModalProps> = ({ isOpen, onClose, onConfirm }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-zinc-900 border border-zinc-700 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Sign Out?</h2>
          <p className="text-zinc-400 mb-8">Are you sure you want to sign out?</p>
          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              No
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Yes
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  rank: number;
  globalRank: number | null;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ isOpen, score, rank, globalRank, onPlayAgain, onMainMenu }) => (
  isOpen ? (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-20">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900 border border-zinc-700 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center"
      >
        <div className="text-6xl mb-4">💀</div>
        <h2 className="text-4xl font-black text-white mb-2">GAME OVER</h2>
        <p className="text-zinc-400 mb-6">You were eliminated!</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-zinc-800 p-4 rounded-xl">
            <div className="text-xs text-zinc-500 uppercase font-bold">Final Score</div>
            <div className="text-2xl font-mono text-amber-500 font-bold">{score.toLocaleString()}</div>
          </div>
          <div className="bg-zinc-800 p-4 rounded-xl">
            <div className="text-xs text-zinc-500 uppercase font-bold">Rank Reached</div>
            <div className="text-2xl font-mono text-white font-bold">#{rank}</div>
          </div>
          {globalRank && (
            <div className="bg-zinc-800 p-4 rounded-xl col-span-2">
              <div className="text-xs text-zinc-500 uppercase font-bold">Global Rank</div>
              <div className="text-2xl font-mono text-amber-500 font-bold">#{globalRank}</div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button 
            onClick={onPlayAgain}
            className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-4 rounded-xl text-xl transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-6 h-6 fill-current" />
            Play Again
          </button>
          
          <button 
            onClick={onMainMenu}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Main Menu
          </button>
        </div>
      </motion.div>
    </div>
  ) : null
);
