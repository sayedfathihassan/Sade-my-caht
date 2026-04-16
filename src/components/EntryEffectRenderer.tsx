import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { UserAvatar } from "./UserAvatar";

interface EntryEffectRendererProps {
  key?: any;
  effectId: string;
  username: string;
  avatarUrl?: string;
  frameId?: string;
  badgeId?: string;
  onComplete: () => void;
}

export function EntryEffectRenderer({ effectId, username, avatarUrl, frameId, badgeId, onComplete }: EntryEffectRendererProps) {
  useEffect(() => {
    // Auto-remove the effect after 3 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const renderEffect = () => {
    switch (effectId) {
      case 'effect_sports_car':
        return (
          <motion.div
            initial={{ x: '-100vw', opacity: 0 }}
            animate={{ x: '100vw', opacity: 1 }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
            className="absolute top-1/2 left-0 -translate-y-1/2 flex items-center gap-4 z-[100]"
          >
            <div className="relative">
              <img src="https://cdn-icons-png.flaticon.com/512/3204/3204065.png" alt="Sports Car" className="w-64 h-auto drop-shadow-2xl" />
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <UserAvatar username={username} src={avatarUrl} size="md" frameUrl={frameId} />
                <span className="bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full mt-1 backdrop-blur-sm border border-white/10">
                  {username} وصل!
                </span>
              </div>
            </div>
          </motion.div>
        );

      case 'effect_pegasus':
        return (
          <motion.div
            initial={{ x: '100vw', y: '50vh', opacity: 0, scale: 0.5 }}
            animate={{ x: '-100vw', y: '-20vh', opacity: 1, scale: 1.5 }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="absolute z-[100]"
          >
            <div className="relative">
              <img src="https://cdn-icons-png.flaticon.com/512/3698/3698000.png" alt="Pegasus" className="w-72 h-auto drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]" />
              <div className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <UserAvatar username={username} src={avatarUrl} size="md" frameUrl={frameId} />
                <span className="bg-amber-500/80 text-black text-xs font-black px-3 py-1 rounded-full mt-1 backdrop-blur-sm shadow-lg">
                  {username}
                </span>
              </div>
            </div>
          </motion.div>
        );

      case 'effect_magic_carpet':
        return (
          <motion.div
            initial={{ x: '-100vw', y: '20vh', opacity: 0 }}
            animate={{ 
              x: '100vw', 
              y: ['20vh', '10vh', '30vh', '15vh'],
              opacity: [0, 1, 1, 0]
            }}
            transition={{ duration: 3.5, ease: "easeInOut" }}
            className="absolute z-[100]"
          >
            <div className="relative">
              <img src="https://cdn-icons-png.flaticon.com/512/867/867084.png" alt="Magic Carpet" className="w-56 h-auto drop-shadow-2xl" />
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <UserAvatar username={username} src={avatarUrl} size="md" frameUrl={frameId} />
                <span className="bg-purple-500/80 text-white text-xs font-bold px-3 py-1 rounded-full mt-1 backdrop-blur-sm">
                  {username}
                </span>
              </div>
            </div>
          </motion.div>
        );

      case 'effect_dragon':
        return (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -45 }}
            animate={{ scale: [0, 1.5, 2], opacity: [0, 1, 0], rotate: 0 }}
            transition={{ duration: 2.5, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100]"
          >
            <div className="relative">
              <img src="https://cdn-icons-png.flaticon.com/512/3093/3093121.png" alt="Dragon" className="w-96 h-auto drop-shadow-[0_0_50px_rgba(255,0,0,0.6)]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <UserAvatar username={username} src={avatarUrl} size="lg" frameUrl={frameId} />
                <span className="bg-red-600/90 text-white text-sm font-black px-4 py-1.5 rounded-full mt-2 backdrop-blur-sm shadow-[0_0_15px_rgba(255,0,0,0.5)] border border-red-400">
                  دخول أسطوري: {username}
                </span>
              </div>
            </div>
          </motion.div>
        );

      case 'effect_helicopter':
        return (
          <motion.div
            initial={{ y: '-100vh', x: '20vw', rotate: 5 }}
            animate={{ y: '20vh', x: '0vw', rotate: 0 }}
            exit={{ y: '100vh', opacity: 0 }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="absolute top-0 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div className="relative flex flex-col items-center">
              <motion.img 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                src="https://cdn-icons-png.flaticon.com/512/287/287224.png" 
                alt="Helicopter" 
                className="w-80 h-auto drop-shadow-2xl" 
              />
              <div className="mt-4 flex flex-col items-center">
                <UserAvatar username={username} src={avatarUrl} size="lg" frameUrl={frameId} />
                <span className="bg-blue-600 text-white text-sm font-black px-6 py-2 rounded-full mt-2 shadow-xl border-2 border-white/20">
                  VIP ARRIVAL: {username}
                </span>
              </div>
            </div>
          </motion.div>
        );

      case 'effect_ufo':
        return (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: -200 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 1.5, type: "spring" }}
            className="absolute top-1/4 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div className="relative flex flex-col items-center">
              <motion.div
                animate={{ 
                  filter: ["hue-rotate(0deg)", "hue-rotate(360deg)"],
                  y: [0, -20, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <img src="https://cdn-icons-png.flaticon.com/512/1048/1048953.png" alt="UFO" className="w-72 h-auto" />
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 0.4, scaleY: 1 }}
                className="w-40 h-64 bg-gradient-to-b from-green-400 to-transparent origin-top blur-xl"
              />
              <div className="absolute top-64 flex flex-col items-center">
                <UserAvatar username={username} src={avatarUrl} size="lg" frameUrl={frameId} />
                <span className="bg-green-500 text-black text-xs font-black px-4 py-1 rounded-full mt-2 tracking-widest uppercase">
                  Abducted: {username}
                </span>
              </div>
            </div>
          </motion.div>
        );

      case 'effect_phoenix':
        return (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: 1 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100]"
          >
            <div className="relative flex flex-col items-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"]
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <img src="https://cdn-icons-png.flaticon.com/512/2619/2619234.png" alt="Phoenix" className="w-80 h-auto drop-shadow-[0_0_40px_rgba(255,100,0,0.8)]" />
              </motion.div>
              <div className="absolute flex flex-col items-center">
                <UserAvatar username={username} src={avatarUrl} size="lg" frameUrl={frameId} />
                <span className="bg-gradient-to-r from-orange-600 to-red-600 text-white text-sm font-black px-6 py-2 rounded-full mt-4 shadow-2xl border border-orange-400">
                  LEGENDARY: {username}
                </span>
              </div>
            </div>
          </motion.div>
        );

      case 'effect_supercar_gold':
        return (
          <motion.div
            initial={{ x: '-100vw', skewX: -20 }}
            animate={{ x: '100vw', skewX: 0 }}
            transition={{ duration: 2, ease: "circIn" }}
            className="absolute top-1/2 left-0 -translate-y-1/2 z-[100]"
          >
            <div className="relative flex items-center">
              <div className="relative">
                <img 
                  src="https://cdn-icons-png.flaticon.com/512/3204/3204065.png" 
                  alt="Gold Supercar" 
                  className="w-96 h-auto drop-shadow-[0_0_30px_rgba(255,215,0,0.6)] brightness-125 saturate-150" 
                  style={{ filter: 'drop-shadow(0 0 20px gold)' }}
                />
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <UserAvatar username={username} src={avatarUrl} size="lg" frameUrl={frameId} />
                  <span className="bg-amber-500 text-black text-sm font-black px-6 py-2 rounded-full mt-2 shadow-[0_0_20px_rgba(255,215,0,0.5)] border-2 border-white">
                    GOLDEN RIDE: {username}
                  </span>
                </div>
              </div>
              <motion.div 
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.1, repeat: 20 }}
                className="w-40 h-2 bg-amber-400 blur-sm -ml-10"
              />
            </div>
          </motion.div>
        );

      default:
        // Fallback generic effect
        return (
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100]"
          >
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-1 rounded-full shadow-[0_0_50px_rgba(245,158,11,0.5)]">
              <div className="bg-black/80 backdrop-blur-md rounded-full px-8 py-4 flex items-center gap-4">
                <UserAvatar username={username} src={avatarUrl} size="lg" frameUrl={frameId} />
                <div className="text-center">
                  <span className="text-amber-500 text-sm font-bold block mb-1">دخول مميز</span>
                  <span className="text-white text-xl font-black">{username}</span>
                </div>
              </div>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
      {renderEffect()}
    </div>
  );
}
