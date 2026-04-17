import { useState, useEffect } from "react";
import { User } from "@/src/types";
import { supabase } from "@/src/lib/supabase";
import { motion, AnimatePresence } from "motion/react";
import { X, MessageSquare, Gift, Shield, ShieldOff, UserPlus, Star, UserMinus, Bell } from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { EditProfileModal } from "./EditProfileModal";
import { VIPBadge } from "./VIPBadge";
import { ChatBubbleRenderer } from "./ChatBubbleRenderer";
import { cn } from "@/src/lib/utils";
import { followService } from "@/src/services/followService";
import { useAuth } from "@/src/contexts/AuthContext";
import { storeService } from "@/src/services/storeService";
import { StoreItem } from "@/src/types";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onStartChat: (user: User) => void;
  onSendGift: (user: User) => void;
  roomId?: string;
  myRole?: string;
  onWarn?: (user: User) => void;
  onToggleShadowBan?: (user: User) => void;
  onUpdateRole?: (userId: string, newRole: string) => void;
  onBanUser?: (userId: string) => void;
  onUnbanUser?: (userId: string) => void;
}

export function UserModal({ isOpen, onClose, userId, onStartChat, onSendGift, roomId, myRole, onWarn, onToggleShadowBan, onUpdateRole, onBanUser, onUnbanUser }: UserModalProps) {
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [vipStatus, setVipStatus] = useState<any>(null);

  useEffect(() => {
    if (!isOpen || !userId) return;
    const fetchVip = async () => {
      const { data } = await supabase
        .from('vip_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (data) setVipStatus(data);
    };
    fetchVip();
  }, [isOpen, userId]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchItems = async () => {
      const items = await storeService.getItems();
      setStoreItems(items);
    };
    fetchItems();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchUser = async () => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) {
        setUser({
          id: data.id,
          username: data.username,
          email: data.email,
          avatarUrl: data.avatar_url,
          level: data.level,
          xp: data.xp,
          nextLevelXp: data.next_level_xp,
          coins: data.coins,
          diamonds: data.diamonds,
          inventory: data.inventory || [],
          isVerified: data.is_verified,
          isBanned: data.is_banned,
          role: data.role,
          followerCount: data.follower_count,
          followingCount: data.following_count,
          lastTaskResetAt: data.last_task_reset_at,
          createdAt: data.created_at,
          lastActiveAt: data.last_active_at,
          activeFrameId: data.active_frame_id,
          activeBadgeId: data.active_badge_id,
          activeChatBubbleId: data.active_chat_bubble_id,
          activeEntryEffectId: data.active_entry_effect_id
        });
      }
      setLoading(false);
    };

    fetchUser();

    // Check follow status
    if (currentUser && currentUser.id !== userId) {
      followService.isFollowing(currentUser.id, userId).then(setIsFollowing);
    }

    const sub = supabase
      .channel(`user_modal_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `id=eq.${userId}` }, fetchUser)
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [isOpen, userId, currentUser?.id]);

  const handleFollowToggle = async () => {
    if (!currentUser || !user) return;
    try {
      if (isFollowing) {
        await followService.unfollow(currentUser.id, user.id);
        setIsFollowing(false);
      } else {
        await followService.follow(currentUser.id, user.id);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Follow toggle failed", error);
    }
  };

  const isStaff = myRole && ['owner', 'admin', 'moderator', 'observer'].includes(myRole);
  const isTargetStaff = user?.role && ['owner', 'admin', 'moderator', 'observer'].includes(user.role);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" dir="rtl">
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
            className="relative w-full max-w-sm bg-neutral-900 rounded-[32px] border border-white/10 overflow-hidden"
          >
            {/* Cover / Header */}
            <div className="h-32 bg-gradient-to-br from-amber-500/20 to-neutral-800 relative">
              <button 
                onClick={onClose}
                className="absolute top-4 left-4 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="px-6 pb-8 -mt-12 relative">
              <div className="flex flex-col items-center text-center">
                <UserAvatar 
                  username={user?.username || "..."} 
                  src={user?.avatarUrl} 
                  size="xl" 
                  className="border-4 border-neutral-900 mb-4"
                  frameUrl={user?.activeFrameId}
                />
                
                <div className="flex items-center gap-2 mb-1">
                  {user?.activeBadgeId && (
                    <img 
                      src={storeItems.find(i => i.id === user.activeBadgeId)?.imageUrl} 
                      alt="badge" 
                      className="w-5 h-5 object-contain"
                    />
                  )}
                  {vipStatus && <VIPBadge tier={vipStatus.tier} />}
                  <h2 className="text-xl font-bold">{user?.username || "جاري التحميل..."}</h2>
                  {user?.isVerified && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                </div>
                <p className="text-xs text-neutral-500 mb-4">ID: {user?.user_uid || userId.slice(0, 8)}</p>

                {/* Chat Bubble Preview */}
                {user?.activeChatBubbleId && (
                  <div className="mb-6 w-full max-w-[200px]">
                    <ChatBubbleRenderer bubbleId={user.activeChatBubbleId}>
                      <p className="text-[10px] text-center">هذا هو نمط فقاعتي المفضل! ✨</p>
                    </ChatBubbleRenderer>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 w-full mb-8">
                  <div className="bg-white/5 rounded-2xl p-2">
                    <p className="text-[10px] text-neutral-500 mb-1">المستوى</p>
                    <p className="text-xs font-bold text-amber-500">{user?.level || 1}</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-2">
                    <p className="text-[10px] text-neutral-500 mb-1">متابعين</p>
                    <p className="text-xs font-bold text-white">{user?.followerCount || 0}</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-2">
                    <p className="text-[10px] text-neutral-500 mb-1">يتابع</p>
                    <p className="text-xs font-bold text-white">{user?.followingCount || 0}</p>
                  </div>
                  {currentUser?.id === userId && (
                    <div className="bg-white/5 rounded-2xl p-2">
                      <p className="text-[10px] text-neutral-500 mb-1">العملات</p>
                      <p className="text-xs font-bold text-yellow-500">{user?.coins || 0}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 w-full">
                  {currentUser?.id === userId ? (
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="col-span-2 flex items-center justify-center gap-2 bg-amber-500 text-black font-bold py-3.5 rounded-2xl hover:bg-amber-400 transition-all"
                    >
                      <span>تعديل الملف الشخصي</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => user && onStartChat(user)}
                        className="flex items-center justify-center gap-2 bg-white/5 text-white font-bold py-3.5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5"
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span>رسالة</span>
                      </button>
                      <button
                        onClick={() => user && onSendGift(user)}
                        className="flex items-center justify-center gap-2 bg-white/5 text-white font-bold py-3.5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5"
                      >
                        <Gift className="w-5 h-5 text-rose-500" />
                        <span>إهداء</span>
                      </button>
                    </>
                  )}
                </div>

                {currentUser && currentUser.id !== userId && (
                  <button 
                    onClick={handleFollowToggle}
                    className={cn(
                      "w-full mt-3 flex items-center justify-center gap-2 font-bold py-3.5 rounded-2xl transition-all border",
                      isFollowing 
                        ? "bg-white/5 text-neutral-400 border-white/5 hover:bg-white/10" 
                        : "bg-amber-500 text-black border-transparent hover:bg-amber-400"
                    )}
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="w-5 h-5" />
                        <span>إلغاء المتابعة</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        <span>متابعة</span>
                      </>
                    )}
                  </button>
                )}

                {/* Staff Actions */}
                {isStaff && currentUser?.id !== userId && (
                  <div className="flex flex-col gap-3 w-full mt-3">
                    {/* Role Management for Owners/Admins */}
                    {myRole === 'owner' && !isTargetStaff && (
                      <div className="grid grid-cols-3 gap-2 w-full">
                        <button
                          onClick={() => onUpdateRole?.(userId, 'observer')}
                          className="flex flex-col items-center justify-center gap-1 bg-blue-500/10 text-blue-500 font-bold py-3 rounded-2xl border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all"
                        >
                          <Shield className="w-4 h-4" />
                          <span className="text-[10px]">مراقب</span>
                        </button>
                        <button
                          onClick={() => onUpdateRole?.(userId, 'moderator')}
                          className="flex flex-col items-center justify-center gap-1 bg-amber-500/10 text-amber-500 font-bold py-3 rounded-2xl border border-amber-500/20 hover:bg-amber-500 hover:text-black transition-all"
                        >
                          <Shield className="w-4 h-4" />
                          <span className="text-[10px]">مشرف</span>
                        </button>
                        <button
                          onClick={() => onUpdateRole?.(userId, 'admin')}
                          className="flex flex-col items-center justify-center gap-1 bg-purple-500/10 text-purple-500 font-bold py-3 rounded-2xl border border-purple-500/20 hover:bg-purple-500 hover:text-white transition-all"
                        >
                          <Shield className="w-4 h-4" />
                          <span className="text-[10px]">مسؤول</span>
                        </button>
                      </div>
                    )}
                    {myRole === 'admin' && !isTargetStaff && (
                      <div className="grid grid-cols-2 gap-2 w-full">
                        <button
                          onClick={() => onUpdateRole?.(userId, 'observer')}
                          className="flex items-center justify-center gap-2 bg-blue-500/10 text-blue-500 font-bold py-3 rounded-2xl border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all"
                        >
                          <Shield className="w-4 h-4" />
                          <span className="text-xs">تعيين مراقب</span>
                        </button>
                        <button
                          onClick={() => onUpdateRole?.(userId, 'moderator')}
                          className="flex items-center justify-center gap-2 bg-amber-500/10 text-amber-500 font-bold py-3 rounded-2xl border border-amber-500/20 hover:bg-amber-500 hover:text-black transition-all"
                        >
                          <Shield className="w-4 h-4" />
                          <span className="text-xs">تعيين مشرف</span>
                        </button>
                      </div>
                    )}
                    {(myRole === 'owner' || myRole === 'admin') && (user?.role === 'moderator' || user?.role === 'admin') && (
                      <button
                        onClick={() => onUpdateRole?.(userId, 'listener')}
                        className="flex items-center justify-center gap-2 bg-neutral-800 text-neutral-400 font-bold py-3 rounded-2xl border border-white/5 hover:bg-neutral-700 transition-all"
                      >
                        <ShieldOff className="w-4 h-4" />
                        <span className="text-xs">إزالة الرتبة</span>
                      </button>
                    )}

                    {/* Quick Actions */}
                    {!isTargetStaff && (
                      <div className="grid grid-cols-2 gap-3 w-full">
                        <button
                          onClick={() => user && onWarn?.(user)}
                          className="flex items-center justify-center gap-2 bg-red-500/10 text-red-500 font-bold py-3 rounded-2xl border border-red-500/20 hover:bg-red-500/20 transition-all"
                        >
                          <Bell className="w-4 h-4" />
                          <span className="text-xs">تحذير</span>
                        </button>
                        <button
                          onClick={() => onBanUser?.(userId)}
                          className="flex items-center justify-center gap-2 bg-red-600/10 text-red-600 font-bold py-3 rounded-2xl border border-red-600/20 hover:bg-red-600 hover:text-white transition-all"
                        >
                          <Shield className="w-4 h-4" />
                          <span className="text-xs">حظر نهائي</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
      {user && (
        <EditProfileModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          user={user} 
        />
      )}
    </AnimatePresence>
  );
}
