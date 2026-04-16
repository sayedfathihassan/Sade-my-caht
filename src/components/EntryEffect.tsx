import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { Sparkles, Zap, Crown, Flame, Snowflake, Orbit } from "lucide-react";

interface EntryEffectProps {
  effectId: string | null;
  username: string;
  onComplete: () => void;
}

export function EntryEffect({ effectId, username, onComplete }: EntryEffectProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 500); // Wait for exit animation
    }, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!effectId) return null;

  const renderEffect = () => {
    switch (effectId) {
      case 'entry_thunder':
        return (
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0, 1, 0], scale: [1, 1.2, 1, 1.5, 1] }}
              transition={{ duration: 1, repeat: 2 }}
              className="text-blue-400 mb-4"
            >
              <Zap className="w-24 h-24 fill-current" />
            </motion.div>
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-2xl font-black text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            >
              وصل الصاعقة {username} ⚡
            </motion.h2>
          </div>
        );
      case 'entry_stars':
        return (
          <div className="flex flex-col items-center">
            <div className="relative mb-8">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    scale: [0, 1, 0],
                    x: Math.cos(i * 30 * Math.PI / 180) * 100,
                    y: Math.sin(i * 30 * Math.PI / 180) * 100
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                  className="absolute text-yellow-400"
                >
                  <Sparkles className="w-8 h-8 fill-current" />
                </motion.div>
              ))}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="text-amber-500"
              >
                <Sparkles className="w-20 h-20 fill-current" />
              </motion.div>
            </div>
            <motion.h2
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-black text-white text-center"
            >
              النجم {username} يضيء الغرفة ✨
            </motion.h2>
          </div>
        );
      case 'entry_king':
        return (
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="text-amber-500 mb-4"
            >
              <Crown className="w-24 h-24 fill-current" />
            </motion.div>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 300 }}
              className="h-1 bg-gradient-to-r from-transparent via-rose-600 to-transparent mb-4"
            />
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-3xl font-black text-white tracking-widest"
            >
              تحية للملك {username} 👑
            </motion.h2>
          </div>
        );
      case 'entry_fire':
        return (
          <div className="flex flex-col items-center">
            <div className="relative mb-8">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 50, scale: 0.5 }}
                  animate={{ opacity: [0, 1, 0], y: -100, scale: [0.5, 1.5, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  className="absolute text-orange-500"
                  style={{ left: `${(i - 2) * 30}px` }}
                >
                  <Flame className="w-16 h-16 fill-current" />
                </motion.div>
              ))}
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-red-500 relative z-10"
              >
                <Flame className="w-24 h-24 fill-current drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]" />
              </motion.div>
            </div>
            <motion.h2
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]"
            >
              دخول ناري من {username} 🔥
            </motion.h2>
          </div>
        );
      case 'entry_ice':
        return (
          <div className="flex flex-col items-center">
            <div className="relative mb-8 w-full flex justify-center">
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: -50, x: (Math.random() - 0.5) * 200, rotate: 0 }}
                  animate={{ opacity: [0, 1, 0], y: 150, x: (Math.random() - 0.5) * 200, rotate: 360 }}
                  transition={{ duration: 2 + Math.random(), repeat: Infinity, delay: Math.random() * 2 }}
                  className="absolute text-cyan-300"
                >
                  <Snowflake className="w-6 h-6" />
                </motion.div>
              ))}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="text-cyan-400 relative z-10"
              >
                <Snowflake className="w-24 h-24 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]" />
              </motion.div>
            </div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]"
            >
              عاصفة {username} الثلجية ❄️
            </motion.h2>
          </div>
        );
      case 'entry_portal':
        return (
          <div className="flex flex-col items-center">
            <div className="relative mb-8 flex justify-center items-center">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.5, 1.2], opacity: [0, 1, 0.8], rotate: 360 }}
                transition={{ duration: 3, ease: "easeInOut" }}
                className="absolute text-purple-600"
              >
                <Orbit className="w-40 h-40 drop-shadow-[0_0_30px_rgba(147,51,234,0.8)]" />
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, type: "spring" }}
                className="text-fuchsia-400 relative z-10 bg-black/50 rounded-full p-4 backdrop-blur-md"
              >
                <Sparkles className="w-16 h-16 fill-current" />
              </motion.div>
            </div>
            <motion.h2
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ delay: 1.5 }}
              className="text-3xl font-black text-white drop-shadow-[0_0_15px_rgba(192,38,211,0.8)]"
            >
              {username} يعبر البوابة الزمنية 🌌
            </motion.h2>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-none bg-black/20 backdrop-blur-[2px]"
        >
          {renderEffect()}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
