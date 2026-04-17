import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Trophy, Sparkles, Coins, Diamond, Star, RotateCw, TrendingUp, Skull } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface Reward {
  id: string;
  label: string;
  value: number;
  type: 'coins' | 'diamonds' | 'xp' | 'nothing';
  color: string;
  icon: React.ReactNode;
  weight: number; // Probability weight
}

const REWARDS: Reward[] = [
  { id: 'nothing1', label: 'حظ أوفر', value: 0, type: 'nothing', color: '#404040', icon: <Skull className="w-4 h-4" />, weight: 50 },
  { id: 'c100', label: 'x0.5 عملات', value: 0.5, type: 'coins', color: '#f59e0b', icon: <Coins className="w-4 h-4" />, weight: 30 },
  { id: 'nothing2', label: 'حاول ثانية', value: 0, type: 'nothing', color: '#404040', icon: <Skull className="w-4 h-4" />, weight: 40 },
  { id: 'c500', label: 'x2 عملات', value: 2, type: 'coins', color: '#fbbf24', icon: <Coins className="w-4 h-4" />, weight: 15 },
  { id: 'd1', label: '1 ألماسة', value: 1, type: 'diamonds', color: '#3b82f6', icon: <Diamond className="w-4 h-4" />, weight: 10 },
  { id: 'x200', label: '200 خبرة', value: 200, type: 'xp', color: '#8b5cf6', icon: <Star className="w-4 h-4" />, weight: 15 },
  { id: 'nothing3', label: 'خسارة', value: 0, type: 'nothing', color: '#404040', icon: <Skull className="w-4 h-4" />, weight: 30 },
  { id: 'c2000', label: 'x10 عملات', value: 10, type: 'coins', color: '#f59e0b', icon: <Coins className="w-4 h-4" />, weight: 3 },
  { id: 'd10', label: '10 ألماسات', value: 10, type: 'diamonds', color: '#60a5fa', icon: <Diamond className="w-4 h-4" />, weight: 2 },
  { id: 'jackpot', label: 'الجاكبوت!', value: 50, type: 'diamonds', color: '#ef4444', icon: <Trophy className="w-4 h-4" />, weight: 1 },
];

interface WheelOfFortuneProps {
  isOpen: boolean;
  onClose: () => void;
  userCoins: number;
  onSpinStart: (bet: number) => void;
  onWin: (reward: Reward, bet: number) => void;
}

export function WheelOfFortune({ isOpen, onClose, userCoins, onSpinStart, onWin }: WheelOfFortuneProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [betAmount, setBetAmount] = useState(200);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<Reward | null>(null);
  const spinSound = useRef<HTMLAudioElement | null>(null);
  const winSound = useRef<HTMLAudioElement | null>(null);
  const loseSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    spinSound.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3");
    winSound.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3");
    loseSound.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3");
  }, []);

  const spin = async () => {
    if (isSpinning || userCoins < betAmount) return;
    
    setIsSpinning(true);
    setResult(null);
    
    // Request result from server (via parent RoomView)
    try {
      // Re-use current spin animation logic but triggered by server result
      const forcedRewardId = await onSpinStart(betAmount);
      if (!forcedRewardId) throw new Error("فشل الحصول على النتيجة");

      // Play spin sound
      if (spinSound.current) {
        spinSound.current.currentTime = 0;
        spinSound.current.play().catch(() => {});
      }

      const selectedReward = REWARDS.find(r => r.id === forcedRewardId) || REWARDS[0];
      const rewardIndex = REWARDS.indexOf(selectedReward);
      const segmentAngle = 360 / REWARDS.length;
      const extraSpins = 8 + Math.floor(Math.random() * 5);
      const targetRotation = rotation + (extraSpins * 360) + (360 - (rewardIndex * segmentAngle));
      
      setRotation(targetRotation);

      setTimeout(() => {
        setIsSpinning(false);
        setResult(selectedReward);
        onWin(selectedReward, betAmount);
        
        if (selectedReward.type === 'nothing') {
          loseSound.current?.play().catch(() => {});
        } else {
          winSound.current?.play().catch(() => {});
        }
      }, 5000);
    } catch (err) {
      console.error(err);
      setIsSpinning(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" dir="rtl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-md bg-neutral-900 rounded-[40px] border border-white/10 p-8 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-xl">
                  <Sparkles className="w-6 h-6 text-amber-500" />
                </div>
                <h2 className="text-xl font-bold">عجلة الحظ الملكية</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Wheel Container */}
            <div className="relative aspect-square w-full max-w-[280px] mx-auto mb-8">
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
                <div className="w-6 h-8 bg-amber-500 clip-path-triangle shadow-lg" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
              </div>

              {/* The Wheel */}
              <motion.div
                animate={{ rotate: rotation }}
                transition={{ duration: 5, ease: [0.15, 0, 0.15, 1] }}
                className="w-full h-full rounded-full border-8 border-neutral-800 relative overflow-hidden shadow-2xl"
                style={{ background: '#171717' }}
              >
                {REWARDS.map((reward, i) => {
                  const angle = 360 / REWARDS.length;
                  return (
                    <div
                      key={reward.id}
                      className="absolute top-0 left-1/2 w-1/2 h-full origin-left"
                      style={{
                        transform: `rotate(${i * angle}deg)`,
                        background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                        borderLeft: '1px solid rgba(255,255,255,0.05)'
                      }}
                    >
                      <div 
                        className="absolute top-1/2 left-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
                        style={{ transform: `rotate(${angle / 2}deg) translateX(40px)` }}
                      >
                        <div className="text-amber-500">{reward.icon}</div>
                        <span className="text-[8px] font-bold text-white/60 whitespace-nowrap">{reward.label}</span>
                      </div>
                    </div>
                  );
                })}
              </motion.div>

              {/* Center Cap */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="w-12 h-12 bg-neutral-900 rounded-full border-4 border-neutral-800 shadow-xl flex items-center justify-center">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                </div>
              </div>
            </div>

            {/* Result Display */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-6"
                >
                  {result.type === 'nothing' ? (
                    <>
                      <p className="text-neutral-400 text-sm mb-1">للأسف...</p>
                      <h3 className="text-2xl font-black text-neutral-500 flex items-center justify-center gap-2">
                        {result.icon}
                        {result.label}
                      </h3>
                    </>
                  ) : (
                    <>
                      <p className="text-neutral-400 text-sm mb-1">مبروك! لقد ربحت</p>
                      <h3 className="text-2xl font-black text-amber-500 flex items-center justify-center gap-2">
                        {result.icon}
                        {result.label}
                      </h3>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Betting Levels */}
            <div className="mb-6">
              <p className="text-[10px] font-bold text-neutral-500 mb-2 mr-1">اختر قيمة الرهان (تضاعف الجوائز)</p>
              <div className="flex gap-2">
                {[200, 500, 1000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => !isSpinning && setBetAmount(amount)}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-xs font-bold transition-all border",
                      betAmount === amount 
                        ? "bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20" 
                        : "bg-black/40 border-white/5 text-neutral-400 hover:border-white/10"
                    )}
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <button
                onClick={spin}
                disabled={isSpinning || userCoins < betAmount}
                className={cn(
                  "w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-lg",
                  isSpinning 
                    ? "bg-neutral-800 text-neutral-500 cursor-not-allowed" 
                    : userCoins >= betAmount
                      ? "bg-amber-500 text-black hover:bg-amber-400 shadow-amber-500/20"
                      : "bg-red-500/10 text-red-500 border border-red-500/20 cursor-not-allowed"
                )}
              >
                {isSpinning ? (
                  <RotateCw className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <RotateCw className="w-6 h-6" />
                    <span>لف العجلة ({betAmount})</span>
                  </>
                )}
              </button>
              
              <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
                <Coins className="w-3 h-3" />
                <span>رصيدك الحالي: {userCoins} عملة</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
