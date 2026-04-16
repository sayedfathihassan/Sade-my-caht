import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Swords, Timer, Zap } from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { PKChallenge, User } from "@/src/types";
import { supabase } from "@/src/lib/supabase";

interface PKChallengeDisplayProps {
  challenge: PKChallenge;
  user1: User | null;
  user2: User | null;
}

export function PKChallengeDisplay({ challenge, user1, user2 }: PKChallengeDisplayProps) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(challenge.endsAt).getTime();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(diff);
      if (diff === 0) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [challenge.endsAt]);

  const totalPoints = challenge.user1Points + challenge.user2Points;
  const user1Percent = totalPoints === 0 ? 50 : (challenge.user1Points / totalPoints) * 100;
  const user2Percent = totalPoints === 0 ? 50 : (challenge.user2Points / totalPoints) * 100;

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="w-full bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 shadow-2xl overflow-hidden relative"
      dir="rtl"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-red-500/10 pointer-events-none" />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2 text-amber-500">
          <Swords className="w-5 h-5 animate-pulse" />
          <span className="text-sm font-black tracking-widest uppercase">تحدي PK مباشر</span>
        </div>
        <div className="flex items-center gap-2 bg-black/40 px-4 py-1.5 rounded-full border border-white/5">
          <Timer className="w-4 h-4 text-neutral-400" />
          <span className="text-sm font-mono font-bold text-white">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between relative z-10">
        {/* User 1 */}
        <div className="flex flex-col items-center gap-3 w-1/3">
          <div className="relative">
            <div className="absolute -inset-2 bg-blue-500/20 rounded-full blur-md animate-pulse" />
            <UserAvatar username={user1?.username || "..."} src={user1?.avatarUrl} size="xl" className="border-2 border-blue-500 relative z-10" />
            <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-lg">TEAM A</div>
          </div>
          <p className="text-sm font-bold truncate w-full text-center">{user1?.username || "جاري التحميل..."}</p>
          <div className="flex items-center gap-1 text-blue-400">
            <Zap className="w-3 h-3 fill-current" />
            <span className="text-lg font-black">{challenge.user1Points.toLocaleString()}</span>
          </div>
        </div>

        {/* VS Divider */}
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-red-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="text-xl font-black text-white italic">VS</span>
          </div>
          <div className="h-12 w-0.5 bg-gradient-to-b from-white/20 to-transparent" />
        </div>

        {/* User 2 */}
        <div className="flex flex-col items-center gap-3 w-1/3">
          <div className="relative">
            <div className="absolute -inset-2 bg-red-500/20 rounded-full blur-md animate-pulse" />
            <UserAvatar username={user2?.username || "..."} src={user2?.avatarUrl} size="xl" className="border-2 border-red-500 relative z-10" />
            <div className="absolute -bottom-2 -left-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-lg">TEAM B</div>
          </div>
          <p className="text-sm font-bold truncate w-full text-center">{user2?.username || "جاري التحميل..."}</p>
          <div className="flex items-center gap-1 text-red-400">
            <Zap className="w-3 h-3 fill-current" />
            <span className="text-lg font-black">{challenge.user2Points.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-8 relative h-4 bg-neutral-800 rounded-full overflow-hidden border border-white/5">
        <motion.div
          initial={{ width: "50%" }}
          animate={{ width: `${user1Percent}%` }}
          className="absolute inset-y-0 right-0 bg-gradient-to-l from-blue-600 to-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
        />
        <motion.div
          initial={{ width: "50%" }}
          animate={{ width: `${user2Percent}%` }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
        />
        {/* Center Indicator */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-6 bg-white shadow-xl z-20" />
      </div>

      {/* Winning Indicator */}
      <div className="mt-4 flex justify-between text-[10px] font-black uppercase tracking-tighter">
        <span className={challenge.user1Points > challenge.user2Points ? "text-blue-400 animate-bounce" : "text-neutral-600"}>
          {challenge.user1Points > challenge.user2Points ? "متقدم حالياً" : "تراجع"}
        </span>
        <span className={challenge.user2Points > challenge.user1Points ? "text-red-400 animate-bounce" : "text-neutral-600"}>
          {challenge.user2Points > challenge.user1Points ? "متقدم حالياً" : "تراجع"}
        </span>
      </div>
    </motion.div>
  );
}
