import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Gift, Coins, Users, Timer, Sparkles } from "lucide-react";
import { LuckyBox, User } from "@/src/types";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/contexts/AuthContext";

interface LuckyBoxDisplayProps {
  box: LuckyBox;
  onClaim: () => void;
}

export function LuckyBoxDisplay({ box, onClaim }: LuckyBoxDisplayProps) {
  const { user } = useAuth();
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);

  useEffect(() => {
    if (user && box.winners.includes(user.id)) {
      setHasClaimed(true);
    }
  }, [box.winners, user]);

  const handleClaim = async () => {
    if (!user || hasClaimed || isClaiming || box.status === 'distributed') return;
    
    setIsClaiming(true);
    try {
      // In a real app, this would be a secure server-side function
      // For this demo, we'll simulate the claim
      const { data, error } = await supabase.rpc('claim_lucky_box', {
        p_box_id: box.id,
        p_user_id: user.id
      });

      if (!error) {
        setHasClaimed(true);
        onClaim();
      }
    } catch (error) {
      console.error("Failed to claim lucky box", error);
    } finally {
      setIsClaiming(false);
    }
  };

  if (box.status === 'distributed' && !hasClaimed) return null;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="w-full bg-gradient-to-br from-amber-500 to-orange-600 rounded-[32px] p-6 shadow-xl shadow-amber-500/20 relative overflow-hidden"
      dir="rtl"
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-xl" />
      
      <div className="flex items-center gap-4 relative z-10">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
          <Gift className="w-10 h-10 text-white animate-bounce" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-black text-white">صندوق الحظ الملكي</h3>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1 text-white/80 text-xs">
              <Coins className="w-3 h-3" />
              <span>{box.totalAmount} عملة</span>
            </div>
            <div className="flex items-center gap-1 text-white/80 text-xs">
              <Users className="w-3 h-3" />
              <span>{box.winners.length}/{box.totalWinners} فائز</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleClaim}
          disabled={hasClaimed || isClaiming || box.status === 'distributed'}
          className={`px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-lg ${
            hasClaimed 
              ? "bg-white/20 text-white cursor-default" 
              : "bg-white text-amber-600 hover:scale-105 active:scale-95 shadow-white/20"
          }`}
        >
          {hasClaimed ? (
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              تم الاستلام
            </div>
          ) : isClaiming ? (
            "جاري..."
          ) : (
            "افتح الآن"
          )}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mt-6 h-2 bg-black/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(box.winners.length / box.totalWinners) * 100}%` }}
          className="h-full bg-white"
        />
      </div>
    </motion.div>
  );
}
