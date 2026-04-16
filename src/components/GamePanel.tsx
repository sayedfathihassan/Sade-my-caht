import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Trophy, RotateCw, Brain } from "lucide-react";

const CHOICES = [
  { id: "rock", icon: "✊", name: "حجر" },
  { id: "paper", icon: "✋", name: "ورقة" },
  { id: "scissors", icon: "✌️", name: "مقص" },
];

interface GamePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onPlay: (choice: string) => void;
  onOpenWheel: () => void;
  onOpenTrivia: () => void;
}

export function GamePanel({ isOpen, onClose, onPlay, onOpenWheel, onOpenTrivia }: GamePanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[70] backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-neutral-900 rounded-t-[32px] border-t border-neutral-800 p-8"
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-500" />
                الألعاب والتحديات
              </h2>
              <button onClick={onClose} className="p-2 bg-neutral-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Wheel of Fortune Banner */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onOpenWheel();
                onClose();
              }}
              className="w-full mb-8 p-6 rounded-[24px] bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-between shadow-lg shadow-amber-500/20 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md group-hover:rotate-12 transition-transform">
                  <RotateCw className="w-8 h-8 text-white" />
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-black text-white">عجلة الحظ الملكية</h3>
                  <p className="text-white/80 text-sm">جرب حظك واربح عملات وألماس!</p>
                </div>
              </div>
              <div className="bg-white/20 px-4 py-2 rounded-xl backdrop-blur-md text-white font-bold text-sm">
                العب الآن
              </div>
            </motion.button>

            {/* Trivia Game Banner */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onOpenTrivia();
                onClose();
              }}
              className="w-full mb-8 p-6 rounded-[24px] bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-between shadow-lg shadow-purple-500/20 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md group-hover:rotate-12 transition-transform">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-black text-white">تحدي العباقرة</h3>
                  <p className="text-white/80 text-sm">أجب على الأسئلة واربح مكافآت!</p>
                </div>
              </div>
              <div className="bg-white/20 px-4 py-2 rounded-xl backdrop-blur-md text-white font-bold text-sm">
                العب الآن
              </div>
            </motion.button>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-neutral-500 mr-2">تحدي حجر ورقة مقص</h3>
              <div className="grid grid-cols-3 gap-6">
                {CHOICES.map((choice) => (
                  <motion.button
                    key={choice.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      onPlay(choice.name);
                      onClose();
                    }}
                    className="flex flex-col items-center gap-4 p-6 rounded-[24px] bg-neutral-800 border border-neutral-700 hover:border-amber-500/50 transition-all"
                  >
                    <span className="text-5xl">{choice.icon}</span>
                    <span className="font-bold">{choice.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
