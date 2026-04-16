import { useState, useEffect } from "react";
import { User, Conversation } from "@/src/types";
import { supabase } from "@/src/lib/supabase";
import { motion, AnimatePresence } from "motion/react";
import { X, MessageSquare, Search } from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { cn } from "@/src/lib/utils";

interface PrivateChatListProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSelectConversation: (conversationId: string, otherUser: User) => void;
}

export function PrivateChatList({ isOpen, onClose, currentUser, onSelectConversation }: PrivateChatListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !currentUser.id) return;

    const fetchConversations = async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .contains('participants', [currentUser.id])
        .order('last_message_at', { ascending: false });
      
      if (data) {
        const convs = await Promise.all(data.map(async (d) => {
          const otherUserId = d.participants.find((id: string) => id !== currentUser.id);
          
          let otherUser: User | undefined;
          if (otherUserId) {
            const { data: userData } = await supabase.from('users').select('*').eq('id', otherUserId).single();
            if (userData) {
              otherUser = {
                id: userData.id,
                username: userData.username,
                email: userData.email,
                avatarUrl: userData.avatar_url,
                level: userData.level,
                xp: userData.xp,
                nextLevelXp: userData.next_level_xp,
                coins: userData.coins,
                diamonds: userData.diamonds,
                inventory: userData.inventory || [],
                isVerified: userData.is_verified,
                isBanned: userData.is_banned,
                role: userData.role,
                followerCount: userData.follower_count,
                followingCount: userData.following_count,
                lastTaskResetAt: userData.last_task_reset_at,
                createdAt: userData.created_at,
                lastActiveAt: userData.last_active_at,
              };
            }
          }

          // Fetch unread count
          const { count } = await supabase
            .from('private_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', d.id)
            .eq('is_read', false)
            .neq('sender_id', currentUser.id);

          return {
            id: d.id,
            participants: d.participants,
            lastMessage: d.last_message,
            lastMessageAt: d.last_message_at,
            unreadCount: { [currentUser.id]: count || 0 },
            otherUser
          } as Conversation;
        }));

        setConversations(convs.filter(c => c.otherUser));
        setLoading(false);
      }
    };

    fetchConversations();
  }, [isOpen, currentUser.id]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="relative w-full max-w-md bg-neutral-900 rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/10 overflow-hidden flex flex-col h-[80vh] sm:h-[600px]"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-xl">
                  <MessageSquare className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">الرسائل الخاصة</h2>
                  <p className="text-xs text-neutral-400">محادثاتك مع الأصدقاء</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : conversations.length > 0 ? (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => conv.otherUser && onSelectConversation(conv.id, conv.otherUser)}
                    className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-transparent hover:border-white/10 group text-right"
                  >
                    <div className="relative">
                      <UserAvatar 
                        username={conv.otherUser?.username || ""} 
                        src={conv.otherUser?.avatarUrl} 
                        size="md" 
                        frameUrl={conv.otherUser?.activeFrameId}
                      />
                      {conv.unreadCount[currentUser.id] > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-neutral-900">
                          {conv.unreadCount[currentUser.id]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-bold truncate">{conv.otherUser?.username}</h3>
                        <span className="text-[10px] text-neutral-500">
                          {new Date(conv.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className={cn(
                        "text-xs truncate",
                        conv.unreadCount[currentUser.id] > 0 ? "text-white font-bold" : "text-neutral-400"
                      )}>
                        {conv.lastMessage || "بدء محادثة جديدة..."}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-neutral-600" />
                  </div>
                  <h3 className="text-neutral-400 font-bold">لا توجد رسائل بعد</h3>
                  <p className="text-xs text-neutral-500 mt-1">ابدأ محادثة مع أصدقائك من ملفاتهم الشخصية</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
