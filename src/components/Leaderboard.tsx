import { useState, useEffect } from "react";
import { User } from "@/src/types";
import { supabase } from "@/src/lib/supabase";
import { motion } from "motion/react";
import { Trophy, Crown, Star, ChevronLeft } from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { formatNumber, cn } from "@/src/lib/utils";

interface LeaderboardProps {
  onClose: () => void;
}

export function Leaderboard({ onClose }: LeaderboardProps) {
  const [topUsers, setTopUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopUsers = async () => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .order('coins', { ascending: false })
        .limit(20);
      
      if (data) {
        setTopUsers(data.map(d => ({
          id: d.id,
          username: d.username,
          email: d.email,
          avatarUrl: d.avatar_url,
          level: d.level,
          xp: d.xp,
          nextLevelXp: d.next_level_xp,
          coins: d.coins,
          diamonds: d.diamonds,
          inventory: d.inventory || [],
          isVerified: d.is_verified,
          isBanned: d.is_banned,
          role: d.role,
          followerCount: d.follower_count,
          followingCount: d.following_count,
          lastTaskResetAt: d.last_task_reset_at,
          createdAt: d.created_at,
          lastActiveAt: d.last_active_at,
          activeFrameId: d.active_frame_id,
          activeBadgeId: d.active_badge_id
        })));
      }
      setLoading(false);
    };

    fetchTopUsers();
  }, []);

  const topThree = topUsers.slice(0, 3);
  const others = topUsers.slice(3);

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      className="fixed inset-0 z-[60] bg-neutral-950 flex flex-col"
      dir="rtl"
    >
      {/* Header */}
      <header className="p-4 flex items-center gap-4 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-xl sticky top-0 z-10">
        <button onClick={onClose} className="p-2 bg-neutral-900 rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-500" />
          قائمة المتصدرين
        </h2>
      </header>

      <div className="flex-1 overflow-y-auto pb-12">
        {/* Podium */}
        <div className="relative h-80 flex items-end justify-center gap-4 px-6 mt-8 mb-12">
          {/* Rank 2 */}
          {topThree[1] && (
            <div className="flex flex-col items-center flex-1">
              <div className="relative mb-4">
                <UserAvatar username={topThree[1].username} size="lg" className="border-slate-400 border-4" frameUrl={topThree[1].activeFrameId} />
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-slate-400 rounded-full flex items-center justify-center text-black font-black text-xs">2</div>
              </div>
              <div className="w-full bg-slate-400/10 border-t-2 border-slate-400/30 rounded-t-2xl p-4 text-center h-24">
                <p className="font-bold text-sm truncate">{topThree[1].username}</p>
                <p className="text-[10px] text-slate-400 mt-1">{formatNumber(topThree[1].coins)} 🪙</p>
              </div>
            </div>
          )}

          {/* Rank 1 */}
          {topThree[0] && (
            <div className="flex flex-col items-center flex-1 -translate-y-8">
              <Crown className="w-8 h-8 text-amber-500 mb-2 animate-bounce" />
              <div className="relative mb-4">
                <UserAvatar username={topThree[0].username} size="xl" className="border-amber-500 border-4 shadow-2xl shadow-amber-500/20" frameUrl={topThree[0].activeFrameId} />
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-black font-black">1</div>
              </div>
              <div className="w-full bg-amber-500/10 border-t-2 border-amber-500/30 rounded-t-2xl p-4 text-center h-32">
                <p className="font-bold text-base truncate">{topThree[0].username}</p>
                <p className="text-xs text-amber-500 font-bold mt-1">{formatNumber(topThree[0].coins)} 🪙</p>
              </div>
            </div>
          )}

          {/* Rank 3 */}
          {topThree[2] && (
            <div className="flex flex-col items-center flex-1">
              <div className="relative mb-4">
                <UserAvatar username={topThree[2].username} size="lg" className="border-amber-700 border-4" frameUrl={topThree[2].activeFrameId} />
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-amber-700 rounded-full flex items-center justify-center text-white font-black text-xs">3</div>
              </div>
              <div className="w-full bg-amber-700/10 border-t-2 border-amber-700/30 rounded-t-2xl p-4 text-center h-20">
                <p className="font-bold text-sm truncate">{topThree[2].username}</p>
                <p className="text-[10px] text-amber-700 mt-1">{formatNumber(topThree[2].coins)} 🪙</p>
              </div>
            </div>
          )}
        </div>

        {/* List */}
        <div className="px-4 space-y-3">
          {others.map((user, index) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              key={user.id}
              className="flex items-center justify-between p-4 bg-neutral-900/50 rounded-2xl border border-neutral-800"
            >
              <div className="flex items-center gap-4">
                <span className="text-neutral-500 font-black w-6">{index + 4}</span>
                <UserAvatar username={user.username} size="sm" frameUrl={user.activeFrameId} />
                <div>
                  <p className="font-bold text-sm">{user.username}</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span className="text-[10px] text-neutral-500">مستوى {user.level}</span>
                  </div>
                </div>
              </div>
              <div className="text-left">
                <p className="font-bold text-amber-500">{formatNumber(user.coins)}</p>
                <p className="text-[10px] text-neutral-500">عملة</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
