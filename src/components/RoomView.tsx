import { useState, useEffect, useRef } from "react";
import { Room, Seat, RoomMember, User, ChatMessage, RoomPoll, RoomGiftGoal, RoomWaitlistEntry, RoomWarning, RoomStaffMessage } from "@/src/types";
import { useAuth } from "@/src/contexts/AuthContext";
import { supabase } from "@/src/lib/supabase";
import { pusher } from "@/src/lib/pusher";
import { UserAvatar } from "./UserAvatar";
import { GiftPanel } from "./GiftPanel";
import { EmojiPanel } from "./EmojiPanel";
import { GamePanel } from "./GamePanel";
import { WheelOfFortune } from "./WheelOfFortune";
import { TriviaGame } from "./TriviaGame";
import { RoomAdminPanel } from "./RoomAdminPanel";
import { UserModal } from "./UserModal";
import { EntryEffect } from "./EntryEffect";
import { PrivateChatList } from "./PrivateChatList";
import { ChatBubbleRenderer } from "./ChatBubbleRenderer";
import { EntryEffectRenderer } from "./EntryEffectRenderer";
import { chatService } from "@/src/services/chatService";
import { taskService } from "@/src/services/taskService";
import { notificationService } from "@/src/services/notificationService";
import { livekitService } from "@/src/services/livekitService";
import { PKChallengeDisplay } from "./PKChallengeDisplay";
import { LuckyBoxDisplay } from "./LuckyBoxDisplay";
import { PKChallenge, LuckyBox } from "@/src/types";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Lock, Unlock, LogOut, Gift, MessageSquare, Send, Users, Crown, Shield, ChevronLeft, ChevronRight, MoreVertical, Smile, Hand, Gamepad2, Megaphone, Settings, Bell, WifiOff, RefreshCw, X, BarChart3, History, Clock } from "lucide-react";
import { formatNumber, cn } from "@/src/lib/utils";

import { STORE_ITEMS } from "@/src/constants/storeItems";

import { PrivateMessageWindow } from "./PrivateMessageWindow";

interface RoomViewProps {
  roomId: string;
  onExit: () => void;
}

export function RoomView({ roomId, onExit }: RoomViewProps) {
  const { user, supabaseUser, refreshUser } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGiftPanelOpen, setIsGiftPanelOpen] = useState(false);
  const [giftRecipient, setGiftRecipient] = useState<{ id: string, name: string } | null>(null);
  const [isEmojiPanelOpen, setIsEmojiPanelOpen] = useState(false);
  const [isGamePanelOpen, setIsGamePanelOpen] = useState(false);
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [isTriviaOpen, setIsTriviaOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isMembersListOpen, setIsMembersListOpen] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [roomUsers, setRoomUsers] = useState<{ id: string, username: string, avatarUrl?: string }[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [myRole, setMyRole] = useState<RoomMember['role']>('listener');

  // Robust Role Detection
  useEffect(() => {
    if (!user || !room) return;
    
    const checkRole = () => {
      // ✅ FIX: Use isSuperAdmin from DB, never a hardcoded email
      if (user.isSuperAdmin) {
        setMyRole('owner');
        return;
      }

      // Owner check
      if (user.id === room.ownerId) {
        setMyRole('owner');
        return;
      }

      // Member role from DB
      const me = members.find(m => m.user_id === user.id);
      if (me) {
        setMyRole(me.role);
      } else {
        setMyRole('listener');
      }
    };

    checkRole();
  }, [user?.id, user?.isSuperAdmin, room?.ownerId, members]);

  useEffect(() => {
    if (isMembersListOpen) {
      const fetchMembers = async () => {
        const { data, error } = await supabase
          .from('room_members')
          .select('*, users(*)')
          .eq('room_id', roomId)
          .eq('is_active', true);
        
        if (data) {
          setMembers(data);
        }
      };
      fetchMembers();
    }
  }, [isMembersListOpen, roomId]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isChatListOpen, setIsChatListOpen] = useState(false);
  const [isChatWindowOpen, setIsChatWindowOpen] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [activePKChallenge, setActivePKChallenge] = useState<PKChallenge | null>(null);
  const [activeLuckyBox, setActiveLuckyBox] = useState<LuckyBox | null>(null);
  const [pkUser1, setPkUser1] = useState<User | null>(null);
  const [pkUser2, setPkUser2] = useState<User | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [onSeat, setOnSeat] = useState<number | null>(null);
  const [activeEntryEffect, setActiveEntryEffect] = useState<{ id: string, username: string } | null>(null);
  const [isLiveKitDisconnected, setIsLiveKitDisconnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);
  const [activeEntryEffects, setActiveEntryEffects] = useState<{id: string, effectId: string, username: string, avatarUrl?: string, frameId?: string, badgeId?: string}[]>([]);
  const [activePolls, setActivePolls] = useState<RoomPoll[]>([]);
  const [activeGiftGoals, setActiveGiftGoals] = useState<RoomGiftGoal[]>([]);
  const [waitlist, setWaitlist] = useState<RoomWaitlistEntry[]>([]);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [isStaffChatOpen, setIsStaffChatOpen] = useState(false);
  const [staffMessages, setStaffMessages] = useState<RoomStaffMessage[]>([]);
  const [lastMessageSentAt, setLastMessageSentAt] = useState<number>(0);
  const [activeWarning, setActiveWarning] = useState<RoomWarning | null>(null);
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);

  // Simulate user joining with an entry effect for testing
  useEffect(() => {
    if (user?.activeEntryEffectId) {
      const effectInstanceId = Math.random().toString(36).substring(7);
      setActiveEntryEffects(prev => [...prev, {
        id: effectInstanceId,
        effectId: user.activeEntryEffectId!,
        username: user.username,
        avatarUrl: user.avatarUrl,
        frameId: user.activeFrameId,
        badgeId: user.activeBadgeId
      }]);
    }
  }, [user?.activeEntryEffectId, user?.username, user?.avatarUrl, user?.activeFrameId, user?.activeBadgeId]);

  const handleRemoveEntryEffect = (idToRemove: string) => {
    setActiveEntryEffects(prev => prev.filter(effect => effect.id !== idToRemove));
  };
  const chatEndRef = useRef<HTMLDivElement>(null);
  const notificationSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    notificationSound.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
    notificationSound.current.volume = 0.3;
  }, []);

  // XP System - runs every minute while in room
  const userRef = useRef(user);
  const roomIdRef = useRef(roomId);

  useEffect(() => {
    userRef.current = user;
    roomIdRef.current = roomId;
  }, [user, roomId]);

  // Pusher Connection Logging
  useEffect(() => {
    pusher.connection.bind('state_change', (states: any) => {
      console.log('📡 Pusher connection state:', states.current);
    });
    return () => {
      pusher.connection.unbind('state_change');
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(async () => {
      const currentUser = userRef.current;
      if (!currentUser) return;
      try {
        const newXp = (currentUser.xp || 0) + 10;
        let newLevel = currentUser.level || 1;
        let nextXp = currentUser.nextLevelXp || 100;

        if (newXp >= nextXp) {
          newLevel += 1;
          nextXp = Math.floor(nextXp * 1.5);
          await handleSendMessage(`وصل إلى المستوى ${newLevel}! 🎉`, "system");
        }

        await supabase
          .from('users')
          .update({
            xp: newXp,
            level: newLevel,
            next_level_xp: nextXp
          })
          .eq('id', currentUser.id);
      } catch (e) {
        console.error("XP update failed", e);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [user?.id]); // Only re-run when user ID changes, not on every user update

  // Task: Room Time - runs every minute independently (مهمة الوقت في الغرفة)
  useEffect(() => {
    if (!user?.id) return;
    console.log('⏱️ Starting room time task tracker for user:', user.id);
    const interval = setInterval(async () => {
      const currentUser = userRef.current;
      if (!currentUser) return;
      console.log('⏱️ Updating time task progress...');
      try {
        await taskService.updateTaskProgress(currentUser.id, 'time', 1);
        console.log('✅ Time task progress updated');
      } catch (e) {
        console.error('❌ Failed to update time task:', e);
      }
    }, 60000); // Every 1 minute

    return () => {
      console.log('⏹️ Clearing room time task tracker');
      clearInterval(interval);
    };
  }, [user?.id]); // CRITICAL: Only depend on user.id, not the full user object

  // Task: Mic Time - only when seated and unmuted
  useEffect(() => {
    if (!user?.id || onSeat === null || isMuted) return;
    console.log('🎤 Starting mic time task tracker');
    const interval = setInterval(async () => {
      const currentUser = userRef.current;
      if (!currentUser) return;
      try {
        await taskService.updateTaskProgress(currentUser.id, 'mic', 1);
        console.log('✅ Mic task progress updated');
      } catch (e) {
        console.error('❌ Failed to update mic task:', e);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [user?.id, onSeat, isMuted]);

  useEffect(() => {
    if (!user || !roomId) return;
    
    const joinRoomAndFetchData = async () => {
      console.log('🚪 User entering room:', roomId);
      
      // UPSERT room_members
      const { error: upsertError } = await supabase
        .from('room_members')
        .upsert([{
          room_id: roomId,
          user_id: user.id,
          is_active: true
        }]);
      
      if (upsertError) console.error('❌ Error joining room:', upsertError);

      // Fetch users immediately
      await fetchRoomUsers();
      
      // Update global member_count in rooms table
      const { count: memberCount } = await supabase
        .from('room_members')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId)
        .eq('is_active', true);
      
      if (memberCount !== null) {
        await supabase
          .from('rooms')
          .update({ member_count: memberCount })
          .eq('id', roomId);
      }
    };

    joinRoomAndFetchData();

    return () => {
      supabase
        .from('room_members')
        .update({ is_active: false })
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .then(async () => {
          // Update member_count on exit
          const { count: memberCount } = await supabase
            .from('room_members')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', roomId)
            .eq('is_active', true);
          
          if (memberCount !== null) {
            await supabase
              .from('rooms')
              .update({ member_count: memberCount })
              .eq('id', roomId);
          }
        });
    };
  }, [user?.id, roomId]);

  useEffect(() => {
    if (!roomId || !user) return;

    // Fetch initial room data
    const fetchRoomData = async () => {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', roomId)
          .single();
        
        if (data) {
          const roomObj = { 
            ...data, 
            ownerId: data.owner_id,
            autoModSettings: data.auto_mod_settings,
            welcomeMessage: data.welcome_message,
            backgroundUrl: data.background_url,
            backgroundMusicUrl: data.background_music_url,
            seatNames: data.seat_names,
            isLockdown: data.is_lockdown,
            slowModeDelay: data.slow_mode_delay,
            bannedUsers: data.banned_users
          } as any;

          // Lockdown check
          const myMember = members.find(m => m.user_id === user.id);
          const isStaff = myMember && ['owner', 'admin', 'moderator', 'observer'].includes(myMember.role);
          
          // Ban check
          if (data.banned_users?.includes(user.id)) {
            alert("أنت محظور من دخول هذه الغرفة.");
            onExit();
            return;
          }

          if (roomObj.isLockdown && !isStaff) {
            alert("الغرفة في وضع الإغلاق حالياً. لا يمكن الدخول.");
            onExit();
            return;
          }

          setRoom(roomObj);

          // Show welcome message
          if (roomObj.welcomeMessage) {
            setMessages(prev => [...prev, {
              id: 'welcome-' + Date.now(),
              roomId,
              userId: 'system',
              username: 'النظام',
              content: roomObj.welcomeMessage,
              type: 'system',
              timestamp: new Date().toISOString()
            }]);
          }
        } else {
          // Fallback if room not found in Supabase
          setRoom({
            id: roomId,
            name: 'غرفة التجربة',
            description: 'غرفة افتراضية (فشل تحميل البيانات)',
            isLive: true,
            ownerId: user?.id || '',
            memberCount: 1,
            coverUrl: 'https://picsum.photos/seed/room/200/200'
          } as any);
        }
      } catch (e) {
        console.warn("Fetch room data failed, using fallback:", e);
        setRoom({
          id: roomId,
          name: 'غرفة التجربة',
          description: 'غرفة افتراضية (فشل تحميل البيانات)',
          isLive: true,
          ownerId: user?.id || '',
          memberCount: 1,
          coverUrl: 'https://picsum.photos/seed/room/200/200'
        } as any);
      }
    };
    fetchRoomData();

    // Listen to room metadata
    const roomSub = supabase
      .channel(`room_${roomId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload) => {
        const roomData = payload.new as any;
        setRoom(prev => ({ ...prev, ...roomData, ownerId: roomData.owner_id }));
        
        if (roomData.announcement && roomData.announcement !== room?.announcement) {
          notificationService.sendNotification(
            user.id,
            'room_announcement',
            `إعلان جديد في ${roomData.name}`,
            roomData.announcement,
            { roomId: roomData.id }
          );
        }

        // Check for kicks/bans
        if (roomData.banned_users?.includes(user.id)) {
          alert("لقد تم حظرك من هذه الغرفة");
          onExit();
        }
      })
      .subscribe();

    // Listen to seats
    const fetchSeats = async () => {
      const { data } = await supabase
        .from('seats')
        .select('*')
        .eq('room_id', roomId)
        .order('number');
      if (data) {
        setSeats(data as any);
        const mySeat = data.find(s => s.user_id === user.id);
        setOnSeat(mySeat ? mySeat.number : null);
        
        // Mute check from seat
        if (mySeat && mySeat.is_muted !== isMuted) {
          setIsMuted(mySeat.is_muted);
          livekitService.setMuted(mySeat.is_muted);
        }

        // Update last activity if on seat
        if (mySeat) {
          supabase.from('seats').update({ last_activity_at: new Date().toISOString() }).eq('id', mySeat.id).then();
        }
      }
    };

    const fetchPolls = async () => {
      const { data } = await supabase
        .from('room_polls')
        .select('*, votes:room_poll_votes(*)')
        .eq('room_id', roomId)
        .eq('status', 'active');
      if (data) setActivePolls(data);
    };

    const fetchGiftGoals = async () => {
      const { data } = await supabase
        .from('room_gift_goals')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_active', true);
      if (data) setActiveGiftGoals(data);
    };

    const fetchWaitlist = async () => {
      const { data } = await supabase
        .from('room_waitlist')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at');
      if (data) setWaitlist(data);
    };

    fetchSeats();
    fetchPolls();
    fetchGiftGoals();
    fetchWaitlist();

    const seatsSub = supabase
      .channel(`seats_${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seats', filter: `room_id=eq.${roomId}` }, fetchSeats)
      .subscribe();

    // Join LiveKit
    const joinLiveKit = async () => {
      try {
        const res = await fetch(`/api/livekit/token?room=${roomId}&identity=${user.id}`);
        const { token } = await res.json();
        const url = import.meta.env.VITE_LIVEKIT_URL;
        if (url && token) {
          await livekitService.join(url, token);
          setIsLiveKitDisconnected(false);
          
          // Trigger entry effect for others via Pusher
          if (user.activeEntryEffectId) {
            await fetch('/api/room/entry', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                roomId,
                userId: user.id,
                effectId: user.activeEntryEffectId,
                username: user.username,
                avatarUrl: user.avatarUrl,
                frameId: user.activeFrameId,
                badgeId: user.activeBadgeId
              })
            });
          }
        }
      } catch (e) {
        console.error("LiveKit join failed:", e);
      }
    };
    joinLiveKit();

    livekitService.onDisconnected(() => {
      setIsLiveKitDisconnected(true);
    });

    // Pusher for room chat
    const channel = pusher.subscribe(`room-${roomId}`);
    channel.bind('new-message', (data: { message: ChatMessage }) => {
      console.log('📩 New message received via Pusher:', data.message.content);
      setMessages(prev => [...prev, data.message]);
      if (notificationSound.current) {
        notificationSound.current.currentTime = 0;
        notificationSound.current.play().catch(() => {});
      }
    });

    channel.bind('clear-chat', () => {
      setMessages([]);
    });

    channel.bind('settings-updated', (data: { settings: any }) => {
      setRoom(prev => prev ? { 
        ...prev, 
        ...data.settings,
        ownerId: data.settings.owner_id || prev.ownerId,
        bannedUsers: data.settings.banned_users || prev.bannedUsers,
        isLockdown: data.settings.is_lockdown !== undefined ? data.settings.is_lockdown : prev.isLockdown
      } : null);

      // Check if I was just banned
      if (data.settings.banned_users?.includes(user?.id)) {
        alert("لقد تم حظرك من هذه الغرفة.");
        onExit();
      }
    });

    channel.bind('poll-created', (data: { poll: RoomPoll }) => {
      setActivePolls(prev => [...prev, data.poll]);
      handleSendMessage(`بدأ تصويت جديد: ${data.poll.question}`, "system");
    });

    channel.bind('poll-voted', (data: { pollId: string, vote: any }) => {
      setActivePolls(prev => prev.map(p => {
        if (p.id === data.pollId) {
          return { ...p, votes: [...(p.votes || []), data.vote] };
        }
        return p;
      }));
    });

    channel.bind('gift-goal-updated', (data: { goal: RoomGiftGoal }) => {
      setActiveGiftGoals(prev => {
        const exists = prev.find(g => g.id === data.goal.id);
        if (exists) {
          return prev.map(g => g.id === data.goal.id ? data.goal : g);
        }
        return [...prev, data.goal];
      });
    });

    channel.bind('waitlist-updated', (data: { waitlist: RoomWaitlistEntry[] }) => {
      setWaitlist(data.waitlist);
    });

    channel.bind('member-updated', (data: { memberId: string, updates: any }) => {
      setMembers(prev => prev.map(m => 
        m.user_id === data.memberId ? { ...m, ...data.updates } : m
      ));
    });

    channel.bind('audit-log-added', (data: { log: any }) => {
      // Optional: show some audit logs to users? Maybe only admins.
      console.log("Audit log:", data.log);
    });

    channel.bind('staff-message', (data: { message: RoomStaffMessage }) => {
      setStaffMessages(prev => [...prev, data.message]);
    });

    channel.bind('user-warning', (data: { warning: any }) => {
      if (data.warning.user_id === user?.id) {
        setActiveWarning(data.warning);
      }
    });

    channel.bind('lockdown-updated', (data: { isLockdown: boolean }) => {
      setRoom(prev => prev ? ({ ...prev, isLockdown: data.isLockdown }) : null);
    });

    channel.bind('slow-mode-updated', (data: { delay: number }) => {
      setRoom(prev => prev ? ({ ...prev, slowModeDelay: data.delay }) : null);
    });

    channel.bind('user-entered', (data: { userId: string, effectId: string, username: string, avatarUrl?: string, frameId?: string, badgeId?: string }) => {
      if (data.userId !== user.id) {
        const effectInstanceId = Math.random().toString(36).substring(7);
        setActiveEntryEffects(prev => [...prev, {
          id: effectInstanceId,
          effectId: data.effectId,
          username: data.username,
          avatarUrl: data.avatarUrl,
          frameId: data.frameId,
          badgeId: data.badgeId
        }]);
      }
      // Refresh member list when someone enters
      fetchRoomUsers();
    });

    channel.bind('new-reaction', (data: { messageId: string, emoji: string, userId: string }) => {
      setMessages(prev => prev.map(msg => {
        if (msg.id === data.messageId) {
          const reactions = { ...(msg.reactions || {}) };
          if (!reactions[data.emoji]) {
            reactions[data.emoji] = [];
          }
          
          if (!reactions[data.emoji].includes(data.userId)) {
            reactions[data.emoji].push(data.userId);
          } else {
            reactions[data.emoji] = reactions[data.emoji].filter(id => id !== data.userId);
            if (reactions[data.emoji].length === 0) {
              delete reactions[data.emoji];
            }
          }
          return { ...msg, reactions };
        }
        return msg;
      }));
    });

    // Listen for entry effects and member updates
    const fetchRoomUsers = async () => {
      const { data } = await supabase
        .from('room_members')
        .select('*, users(*)')
        .eq('room_id', roomId)
        .eq('is_active', true);
      
      if (data) {
        // Map to standard camelCase for the UI
        const mappedMembers = data.map(m => ({
          ...m,
          userId: m.user_id,
          isActive: m.is_active,
          isShadowBanned: m.is_shadow_banned,
          isStealth: m.is_stealth,
          joinedAt: m.joined_at
        }));
        
        setMembers(mappedMembers);
        setRoomUsers(mappedMembers.map(m => ({
          id: m.users?.id,
          username: m.users?.username || 'مستخدم',
          avatarUrl: m.users?.avatar_url
        })).filter(u => u.id));
      }
    };
    fetchRoomUsers();

    // Fetch my specific role immediately
    const fetchMyRole = async () => {
      const { data } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setOnSeat(null);
        // Stop publishing audio
        livekitService.unpublish();
        setMyRole(data.role);
      }
    };
    fetchMyRole();

    const membersSub = supabase
      .channel(`members_${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomId}` }, (payload: any) => {
        if (payload.eventType === 'UPDATE' && payload.new.user_id === user.id && !payload.new.is_active) {
          alert("لقد تم طردك من هذه الغرفة");
          onExit();
        }
        fetchRoomUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(roomSub);
      supabase.removeChannel(seatsSub);
      supabase.removeChannel(membersSub);
      pusher.unsubscribe(`room-${roomId}`);
      livekitService.clearDisconnectedCallback();
      livekitService.leave().catch(console.error);
    };
  }, [roomId, user?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (content: string, type: 'text' | 'gift' | 'system' = 'text') => {
    if (!content.trim() || !user) return;

    // Slow Mode Check
    if (type === 'text' && room?.slowModeDelay && room.slowModeDelay > 0) {
      const now = Date.now();
      const diff = (now - lastMessageSentAt) / 1000;
      if (diff < room.slowModeDelay) {
        // Show error or just return
        return;
      }
      setLastMessageSentAt(now);
    }

    try {
      // Shadow Ban Check - DB uses user_id (snake_case)
      const myMember = members.find(m => m.user_id === user.id);
      if (myMember?.is_shadow_banned && type === 'text') {
        // Only show to self
        const fakeMsg: ChatMessage = {
          id: Math.random().toString(36).slice(2),
          roomId: roomId,
          userId: user.id,
          username: user.username,
          content,
          type,
          timestamp: new Date().toISOString(),
          activeChatBubbleId: user.activeChatBubbleId
        };
        setMessages(prev => [...prev, fakeMsg]);
        setChatInput("");
        return;
      }

      const msgData: ChatMessage = {
        id: Math.random().toString(36).slice(2),
        roomId: roomId,
        userId: user.id,
        username: user.username,
        content,
        type,
        timestamp: new Date().toISOString(),
        activeChatBubbleId: user.activeChatBubbleId,
        activeBadgeId: user.activeBadgeId,
        activeFrameId: user.activeFrameId
      };

      // Send via Pusher API
      console.log('📤 Sending message to server:', msgData.content);
      const res = await fetch('/api/room/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomId, 
          message: msgData,
          autoModSettings: room?.autoModSettings 
        })
      });

      const data = await res.json();
      console.log('📩 Message API response:', data);
      
      if (data.filtered) {
        console.warn('⚠️ Message was filtered by auto-mod');
      }

      setChatInput("");
      
      if (type === 'text') {
        await taskService.updateTaskProgress(user.id, 'chat', 1);
      }
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    try {
      await fetch('/api/room/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, messageId, emoji, userId: user.id })
      });
    } catch (error) {
      console.error("Failed to send reaction", error);
    }
  };

  const handleTakeSeat = async (seatNumber: number) => {
    if (!user || onSeat !== null) return;
    
    const seat = seats.find(s => s.number === seatNumber);
    if (seat?.is_locked) return;
    
    try {
      const { data, error } = await supabase
        .from('seats')
        .update({
          user_id: user.id,
          joined_at: new Date().toISOString(),
        })
        .eq('room_id', roomId)
        .eq('number', seatNumber)
        .select()
        .single();
      
      if (data) {
        setOnSeat(seatNumber);
        setIsMuted(false);
        // Start publishing audio
        livekitService.publish();
      }
    } catch (error) {
      console.error('Error taking seat:', error);
    }
  };

  const handleLeaveSeat = async () => {
    if (!user || onSeat === null) return;
    
    try {
      await supabase
        .from('seats')
        .update({
          user_id: null,
          joined_at: null,
        })
        .eq('room_id', roomId)
        .eq('number', onSeat);
      
      await livekitService.unpublish();
      setOnSeat(null);
    } catch (error) {
      console.error('Error leaving seat:', error);
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    livekitService.setMuted(newMuted);
  };

  const handleStartPrivateChat = async (otherUser: User) => {
    if (!user) return;
    setIsUserModalOpen(false);
    try {
      const convId = await chatService.getOrCreateConversation(user.id, otherUser.id);
      setActiveConversationId(convId);
      setActiveChatUser(otherUser);
      setIsChatWindowOpen(true);
    } catch (error) {
      console.error("Failed to start private chat", error);
    }
  };

  const handleReconnect = async () => {
    if (!user) return;
    setIsReconnecting(true);
    try {
      const res = await fetch(`/api/livekit/token?room=${roomId}&identity=${user.id}`);
      const { token } = await res.json();
      const url = import.meta.env.VITE_LIVEKIT_URL;
      if (url && token) {
        await livekitService.join(url, token);
        setIsLiveKitDisconnected(false);
        
        // Re-publish if on seat
        if (onSeat !== null && !isMuted) {
          await livekitService.publish();
        }
      }
    } catch (e) {
      console.error("LiveKit reconnect failed:", e);
    } finally {
      setIsReconnecting(false);
    }
  };

  const handleOpenUserModal = (userId: string) => {
    setSelectedUserId(userId);
    setIsUserModalOpen(true);
  };

  const handleToggleShadowBan = async (targetUser: User) => {
    if (!user) return;
    try {
      const member = members.find(m => m.userId === targetUser.id);
      const isShadowBanned = !member?.isShadowBanned;
      
      await supabase
        .from('room_members')
        .update({ is_shadow_banned: isShadowBanned })
        .eq('room_id', roomId)
        .eq('user_id', targetUser.id);
      
      await fetch('/api/room/audit-log/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          adminId: user.id,
          action: isShadowBanned ? 'shadow_ban' : 'unshadow_ban',
          targetId: targetUser.id,
          details: `User ${targetUser.username} ${isShadowBanned ? 'shadow banned' : 'unshadow banned'}`
        })
      });
    } catch (error) {
      console.error("Failed to toggle shadow ban", error);
    }
  };

  const handleWarn = async (targetUser: User) => {
    if (!user) return;
    const reason = prompt("سبب التحذير:");
    if (!reason) return;

    try {
      const { data, error } = await supabase
        .from('room_warnings')
        .insert({
          room_id: roomId,
          user_id: targetUser.id,
          admin_id: user.id,
          reason
        })
        .select()
        .single();
      
      if (data) {
        await fetch('/api/room/warning', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, warning: data })
        });

        await fetch('/api/room/audit-log/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            adminId: user.id,
            action: 'warn',
            targetId: targetUser.id,
            details: `Warned ${targetUser.username} for: ${reason}`
          })
        });
      }
    } catch (error) {
      console.error("Failed to warn user", error);
    }
  };

  const handleUpdateRole = async (targetUserId: string, newRole: string) => {
    if (!user || !room) return;
    try {
      const { error } = await supabase
        .from('room_members')
        .update({ role: newRole })
        .eq('room_id', roomId)
        .eq('user_id', targetUserId);
      
      if (!error) {
        await fetch('/api/room/member/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            memberId: targetUserId,
            updates: { role: newRole }
          })
        });

        await fetch('/api/room/audit-log/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            adminId: user.id,
            action: 'role_change',
            targetId: targetUserId,
            details: `تغيير رتبة المستخدم إلى ${newRole}`
          })
        });
        alert("تم تغيير الرتبة بنجاح");
      }
    } catch (error) {
      console.error("Failed to update role", error);
    }
  };

  const handleBanUser = async (targetUserId: string) => {
    if (!user || !room) return;
    if (targetUserId === room.ownerId) return;
    
    const confirmBan = confirm("هل أنت متأكد من حظر هذا المستخدم نهائياً من الغرفة؟");
    if (!confirmBan) return;

    try {
      const newBanned = [...(room.bannedUsers || []), targetUserId];
      const { error } = await supabase
        .from('rooms')
        .update({ banned_users: newBanned })
        .eq('id', roomId);
      
      if (!error) {
        // Kick user
        await supabase
          .from('room_members')
          .update({ is_active: false })
          .eq('room_id', roomId)
          .eq('user_id', targetUserId);

        await fetch('/api/room/audit-log/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            adminId: user.id,
            action: 'ban',
            targetId: targetUserId,
            details: `حظر المستخدم من الغرفة`
          })
        });

        // Trigger settings update to notify others
        await fetch('/api/room/settings/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, settings: { banned_users: newBanned } })
        });

        alert("تم حظر المستخدم بنجاح");
      }
    } catch (error) {
      console.error("Failed to ban user", error);
    }
  };

  const handleUnbanUser = async (targetUserId: string) => {
    if (!user || !room) return;
    try {
      const newBanned = (room.bannedUsers || []).filter(id => id !== targetUserId);
      const { error } = await supabase
        .from('rooms')
        .update({ banned_users: newBanned })
        .eq('id', roomId);
      
      if (!error) {
        await fetch('/api/room/audit-log/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            adminId: user.id,
            action: 'unban',
            targetId: targetUserId,
            details: `إلغاء حظر المستخدم`
          })
        });

        // Trigger settings update
        await fetch('/api/room/settings/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, settings: { banned_users: newBanned } })
        });

        alert("تم إلغاء الحظر بنجاح");
      }
    } catch (error) {
      console.error("Failed to unban user", error);
    }
  };

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('room_poll_votes')
        .insert({
          poll_id: pollId,
          user_id: user.id,
          option_index: optionIndex
        })
        .select()
        .single();
      
      if (data) {
        await fetch('/api/room/poll/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, pollId, vote: data })
        });
      }
    } catch (error) {
      console.error("Failed to vote", error);
    }
  };

  const handleSendStaffMessage = async (content: string) => {
    if (!content.trim() || !user) return;
    try {
      const msg: RoomStaffMessage = {
        id: Math.random().toString(36).slice(2),
        roomId,
        userId: user.id,
        username: user.username,
        content,
        createdAt: new Date().toISOString()
      };
      await fetch('/api/room/staff-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, message: msg })
      });
    } catch (error) {
      console.error("Failed to send staff message", error);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('room_waitlist')
        .insert({
          room_id: roomId,
          user_id: user.id
        })
        .select();
      
      if (data) {
        const { data: newList } = await supabase
          .from('room_waitlist')
          .select('*')
          .eq('room_id', roomId)
          .order('created_at');
        
        await fetch('/api/room/waitlist/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, waitlist: newList })
        });
      }
    } catch (error) {
      console.error("Failed to join waitlist", error);
    }
  };

  if (!room) return null;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'text-amber-500';
      case 'admin': return 'text-purple-500';
      case 'moderator': return 'text-blue-500';
      case 'observer': return 'text-green-500';
      default: return 'text-neutral-400';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 flex flex-col overflow-hidden" dir="rtl">
      {/* Entry Effect */}
      {activeEntryEffect && (
        <EntryEffect 
          effectId={activeEntryEffect.id} 
          username={activeEntryEffect.username} 
          onComplete={() => setActiveEntryEffect(null)} 
        />
      )}
      
      {/* Atmospheric Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {room.backgroundUrl ? (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${room.backgroundUrl})` }}
          />
        ) : (
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 180, 270, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -inset-[100%] opacity-30"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, #f59e0b 0%, transparent 50%),
                radial-gradient(circle at 70% 70%, #ef4444 0%, transparent 50%),
                radial-gradient(circle at 30% 70%, #3b82f6 0%, transparent 50%),
                radial-gradient(circle at 70% 30%, #8b5cf6 0%, transparent 50%)
              `,
              filter: "blur(80px)"
            }}
          />
        )}
        <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-3xl" />
      </div>

      {/* Background Music */}
      {room.backgroundMusicUrl && (
        <audio
          ref={backgroundMusicRef}
          src={room.backgroundMusicUrl}
          autoPlay
          loop
          className="hidden"
        />
      )}

      {/* Disconnection Notification */}
      <AnimatePresence>
        {isLiveKitDisconnected && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-20 left-4 right-4 z-50 flex justify-center"
          >
            <div className="bg-red-500/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-red-400/50">
              <div className="flex items-center gap-2">
                <WifiOff className="w-5 h-5" />
                <div className="text-sm">
                  <p className="font-bold">انقطع الاتصال الصوتي</p>
                  <p className="text-xs opacity-90">يرجى إعادة الاتصال للمتابعة</p>
                </div>
              </div>
              <button
                onClick={handleReconnect}
                disabled={isReconnecting}
                className="bg-white text-red-600 px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isReconnecting ? (
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                إعادة الاتصال
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="relative z-10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowExitConfirm(true)} className="p-2 bg-neutral-900/50 rounded-full backdrop-blur-md">
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 bg-neutral-900/50 backdrop-blur-md p-1 pl-4 rounded-full border border-white/10">
            <img src={room.coverUrl || `https://picsum.photos/seed/${room.id}/100/100`} className="w-8 h-8 rounded-full border border-amber-500" />
            <div>
              <h2 className="text-sm font-bold truncate max-w-[120px]">{room.name}</h2>
              <p className="text-[10px] text-neutral-400">ID: {room.room_uid || room.id.slice(0, 8)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsMembersListOpen(true)}
            className="flex items-center gap-1.5 bg-neutral-900/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10"
          >
            <Users className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold">{formatNumber(members.length || room.memberCount)}</span>
          </button>
          {(user?.id === room.ownerId || user?.email === 'sayed.fayhi@gmail.com' || myRole === 'admin' || myRole === 'moderator' || myRole === 'observer') && (
            <button 
              onClick={() => setIsAdminPanelOpen(true)}
              className="p-2 bg-neutral-900/50 rounded-full backdrop-blur-md text-amber-500"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
          <button className="p-2 bg-neutral-900/50 rounded-full backdrop-blur-md relative" onClick={() => setIsChatListOpen(true)}>
            <MessageSquare className="w-5 h-5" />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-neutral-900">
                {totalUnread}
              </span>
            )}
          </button>
          <button className="p-2 bg-neutral-900/50 rounded-full backdrop-blur-md">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Announcement Banner */}
      {room.announcement && (
        <div className="relative z-10 px-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-3">
            <Megaphone className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-200/80 leading-relaxed">{room.announcement}</p>
          </div>
        </div>
      )}

      {/* PK Challenge & Lucky Box Area */}
      <div className="relative z-20 px-4 mt-4 space-y-4">
        <AnimatePresence>
          {activePKChallenge && (
            <PKChallengeDisplay 
              challenge={activePKChallenge} 
              user1={pkUser1} 
              user2={pkUser2} 
            />
          )}
          {activeLuckyBox && (
            <LuckyBoxDisplay 
              box={activeLuckyBox} 
              onClaim={() => {}} 
            />
          )}
          {/* Gift Goals */}
          {activeGiftGoals.map(goal => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-500 flex items-center gap-1">
                  <Gift className="w-3 h-3" /> {goal.title}
                </span>
                <span className="text-[10px] text-neutral-400">{goal.currentAmount} / {goal.targetAmount}</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)}%` }}
                  className="h-full bg-rose-500"
                />
              </div>
            </motion.div>
          ))}
          {/* Polls */}
          {activePolls.map(poll => (
            <motion.div
              key={poll.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4"
            >
              <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                {poll.question}
              </h4>
              <div className="space-y-2">
                {poll.options.map((opt, idx) => {
                  const voteCount = poll.votes?.filter(v => v.optionIndex === idx).length || 0;
                  const totalVotes = poll.votes?.length || 1;
                  const percent = (voteCount / totalVotes) * 100;
                  const hasVoted = poll.votes?.some(v => v.userId === user?.id);

                  return (
                    <button
                      key={idx}
                      disabled={hasVoted}
                      onClick={() => handleVote(poll.id, idx)}
                      className="w-full relative h-10 bg-neutral-800/50 rounded-xl overflow-hidden group"
                    >
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        className="absolute inset-y-0 right-0 bg-blue-500/20"
                      />
                      <div className="absolute inset-0 px-4 flex items-center justify-between">
                        <span className="text-xs font-bold">{opt}</span>
                        <span className="text-[10px] font-bold text-neutral-400">{voteCount} صوت</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Seat Grid */}
      <div className="relative z-10 flex-1 px-6 py-8 overflow-y-auto">
        <div className="grid grid-cols-3 gap-y-12 gap-x-6">
          {Array.from({ length: 6 }).map((_, i) => {
            const seatNum = i + 1;
            const seat = seats.find(s => s.number === seatNum);
            const isOccupied = !!seat?.user_id;
            
            return (
              <div key={seatNum} className="flex flex-col items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => isOccupied ? handleOpenUserModal(seat.user_id!) : handleTakeSeat(seatNum)}
                  className={cn(
                    "relative w-20 h-20 rounded-full flex items-center justify-center transition-all",
                    isOccupied ? "bg-transparent" : "bg-neutral-900/50 border-2 border-dashed border-neutral-800"
                  )}
                >
                  {isOccupied ? (
                    <div className="relative">
                      {/* Speaking Visualizer Overlay */}
                      {(() => {
                        const isSpeaking = livekitService.getIsSpeaking(seat.user_id!);
                        if (!isSpeaking) return null;
                        return (
                          <div className="absolute -inset-1 rounded-full border-2 border-amber-500 animate-ping opacity-75 z-0" />
                        );
                      })()}
                      <UserAvatar 
                        username={seat.user_id!} 
                        size="lg" 
                        className={cn(
                          "border-2 relative z-10",
                          getRoleColor(members.find(m => m.user_id === seat.user_id)?.role || (seat.user_id === room?.ownerId ? 'owner' : 'listener')).replace('text-', 'border-')
                        )} 
                        src={members.find(m => m.user_id === seat.user_id)?.users?.avatar_url}
                      />
                      {/* Role Badge */}
                      {(() => {
                        const role = members.find(m => m.user_id === seat.user_id)?.role || (seat.user_id === room?.ownerId ? 'owner' : 'listener');
                        if (role === 'owner') return <Crown className="absolute -top-2 -right-2 w-5 h-5 text-amber-500 drop-shadow-lg z-20" />;
                        if (role === 'admin') return <Shield className="absolute -top-2 -right-2 w-5 h-5 text-purple-500 drop-shadow-lg z-20" />;
                        if (role === 'moderator') return <Shield className="absolute -top-2 -right-2 w-5 h-5 text-blue-500 drop-shadow-lg z-20" />;
                        return null;
                      })()}
                      {seat.is_muted && (
                        <div className="absolute -bottom-1 -right-1 bg-red-500 p-1 rounded-full border border-neutral-950 z-20">
                          <MicOff className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      {seat?.is_locked ? (
                        <Lock className="w-6 h-6 text-neutral-700 mb-1" />
                      ) : (
                        <Mic className="w-6 h-6 text-neutral-600 mb-1" />
                      )}
                      <span className="text-[10px] font-bold text-neutral-600">{room.seatNames?.[seatNum] || seatNum}</span>
                    </div>
                  )}
                  {seat?.is_locked && !isOccupied && (
                    <div className="absolute inset-0 bg-black/20 rounded-full" />
                  )}
                </motion.button>
                <span className="text-[10px] font-bold text-neutral-400 truncate w-full text-center">
                  {isOccupied ? (members.find(m => m.user_id === seat.user_id)?.users?.user_uid || seat.user_id?.slice(0, 8)) : (room.seatNames?.[seatNum] || "فارغ")}
                </span>
              </div>
            );
          })}
        </div>

        {/* Chat Feed */}
        <div className="mt-12 space-y-3 pb-20">
          {messages.map((msg) => (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              key={msg.id}
              className="flex items-start gap-2 group relative"
            >
              <button onClick={() => handleOpenUserModal(msg.userId)} className="shrink-0">
                <UserAvatar username={msg.username} size="sm" frameUrl={msg.activeFrameId} />
              </button>
              
              <div className="flex flex-col gap-1 max-w-[80%]">
                <div className="flex items-center gap-1 mb-0.5 ml-1">
                  {msg.activeBadgeId && (
                    <img 
                      src={STORE_ITEMS.find(i => i.id === msg.activeBadgeId)?.imageUrl} 
                      alt="badge" 
                      className="w-3.5 h-3.5 object-contain"
                    />
                  )}
                  <span className={cn(
                    "text-[10px] font-bold",
                    getRoleColor(members.find(m => m.user_id === msg.userId)?.role || (msg.userId === room?.ownerId ? 'owner' : 'listener'))
                  )}>
                    {msg.username}
                  </span>
                </div>

                <ChatBubbleRenderer 
                  bubbleId={msg.activeChatBubbleId}
                  className={cn(
                    "cursor-pointer",
                    msg.type === 'gift' && !msg.activeChatBubbleId && "bg-amber-500/20 border-amber-500/50",
                    activeReactionMessageId === msg.id && "ring-1 ring-amber-500/50"
                  )}
                >
                  <div onClick={() => setActiveReactionMessageId(activeReactionMessageId === msg.id ? null : msg.id)}>
                    <p className={cn("text-sm", msg.activeChatBubbleId ? "" : "text-neutral-200")}>{msg.content}</p>
                  </div>
                  
                  {/* Reaction Picker Popup */}
                  <AnimatePresence>
                    {activeReactionMessageId === msg.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute -top-12 right-0 bg-neutral-800 border border-neutral-700 rounded-full px-2 py-1.5 flex items-center gap-1 shadow-xl z-50"
                      >
                        {['👍', '❤️', '😂', '🔥', '👏', '😢'].map(emoji => (
                          <button
                            key={emoji}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReaction(msg.id, emoji);
                              setActiveReactionMessageId(null);
                            }}
                            className="w-8 h-8 flex items-center justify-center hover:bg-neutral-700 rounded-full transition-colors hover:scale-110 active:scale-95"
                          >
                            <span className="text-lg">{emoji}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </ChatBubbleRenderer>

                {/* Reactions Display */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {Object.entries(msg.reactions).map(([emoji, users]) => {
                      const userList = users as string[];
                      return (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(msg.id, emoji)}
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border transition-colors",
                            userList.includes(user?.id || '') 
                              ? "bg-amber-500/20 border-amber-500/30 text-amber-500" 
                              : "bg-neutral-900/60 border-white/5 text-neutral-400 hover:bg-neutral-800"
                          )}
                        >
                          <span>{emoji}</span>
                          <span className="font-bold">{userList.length}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 p-3 md:p-4 bg-gradient-to-t from-neutral-950 to-transparent">
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsWaitlistOpen(true)}
              className="relative w-10 h-10 md:w-12 md:h-12 bg-neutral-900/50 rounded-xl md:rounded-2xl flex items-center justify-center border border-neutral-800 shrink-0"
            >
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-neutral-400" />
              {waitlist.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center border border-neutral-950">
                  {waitlist.length}
                </span>
              )}
            </button>

            <button
              onClick={async () => {
                await refreshUser(); // تحديث الرصيد من DB قبل فتح لوحة الهدايا
                setIsGiftPanelOpen(true);
              }}
              className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20 shrink-0"
            >
              <Gift className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </button>

            <button
              onClick={() => setIsEmojiPanelOpen(true)}
              className="w-10 h-10 md:w-12 md:h-12 bg-neutral-900/50 rounded-xl md:rounded-2xl flex items-center justify-center border border-neutral-800 shrink-0"
            >
              <Smile className="w-5 h-5 md:w-6 md:h-6 text-neutral-400" />
            </button>

            <button
              onClick={() => setIsGamePanelOpen(true)}
              className="w-10 h-10 md:w-12 md:h-12 bg-neutral-900/50 rounded-xl md:rounded-2xl flex items-center justify-center border border-neutral-800 shrink-0"
            >
              <Gamepad2 className="w-5 h-5 md:w-6 md:h-6 text-neutral-400" />
            </button>

            {['owner', 'admin', 'moderator', 'observer'].includes(myRole) && (
              <button
                onClick={() => setIsStaffChatOpen(true)}
                className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/20 rounded-xl md:rounded-2xl flex items-center justify-center border border-blue-500/30 shrink-0 relative"
              >
                <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-neutral-950" />
              </button>
            )}
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(chatInput);
            }} 
            className="flex-1 min-w-[120px] relative"
          >
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="قل مرحباً..."
              className="w-full bg-neutral-900/50 backdrop-blur-md border border-neutral-800 rounded-xl md:rounded-2xl px-4 py-2.5 md:py-3 text-sm focus:outline-none focus:border-amber-500/50"
            />
            <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500">
              <Send className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </form>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSendMessage("أهلاً بالجميع! 👋", "system")}
              className="hidden sm:flex px-4 h-10 md:h-12 bg-neutral-900/50 rounded-xl md:rounded-2xl items-center gap-2 border border-neutral-800 text-[10px] md:text-xs font-bold text-neutral-400"
            >
              <Hand className="w-4 h-4" />
              <span>قل مرحباً</span>
            </button>

            {onSeat !== null ? (
              <button
                onClick={toggleMute}
                className={cn(
                  "w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all shrink-0",
                  isMuted ? "bg-neutral-800 text-neutral-400" : "bg-amber-500 text-black"
                )}
              >
                {isMuted ? <MicOff className="w-5 h-5 md:w-6 md:h-6" /> : <Mic className="w-5 h-5 md:w-6 md:h-6" />}
              </button>
            ) : (
              <button
                onClick={() => {
                  const emptySeatIdx = Array.from({ length: 6 }).findIndex(
                    (_, i) => !seats.find(s => s.number === (i + 1) && s.user_id)
                  );
                  if (emptySeatIdx >= 0) handleTakeSeat(emptySeatIdx + 1);
                  else alert("لا توجد مقاعد فارغة حالياً");
                }}
                className="w-10 h-10 md:w-12 md:h-12 bg-neutral-800/50 rounded-xl md:rounded-2xl flex items-center justify-center border border-neutral-700 text-neutral-500 shrink-0"
                title="اضغط لأخذ مقعد"
              >
                <Mic className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            )}
            
            {onSeat !== null && (
              <button
                onClick={handleLeaveSeat}
                className="w-10 h-10 md:w-12 md:h-12 bg-red-500/20 text-red-500 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0"
              >
                <LogOut className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            )}
          </div>
        </div>
      </div>

      <GiftPanel
        isOpen={isGiftPanelOpen}
        onClose={() => {
          setIsGiftPanelOpen(false);
          setGiftRecipient(null);
        }}
        userCoins={user?.coins || 0}
        roomUsers={roomUsers}
        initialRecipientId={giftRecipient?.id}
        initialRecipientName={giftRecipient?.name}
        onDropLuckyBox={async (amount, winners) => {
          if (!user || user.coins < amount) return;
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;
            if (!token) throw new Error("No auth token");

            const response = await fetch('/api/room/lucky-box', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ roomId, amount, winners })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "فشل إلقاء الصندوق");

            setIsGiftPanelOpen(false);
            // Count lucky box as a gift task
            if (user) await taskService.updateTaskProgress(user.id, 'gift', 1);
          } catch (error) {
            console.error("Failed to drop lucky box", error);
            alert("حدث خطأ أثناء رمي الصندوق");
          }
        }}
        onSend={async (gift, recipientId, recipientName) => {
          if (!user || user.coins < gift.cost) return;
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;
            if (!token) throw new Error("No auth token");

            const response = await fetch('/api/room/gift', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ 
                roomId, 
                giftId: gift.id,
                recipientId,
                giftName: gift.name,
                giftCost: gift.cost,
                giftIconUrl: gift.iconUrl,
                recipientName 
              })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "فشل إرسال الهدية");

            setIsGiftPanelOpen(false);
            
            // Server now triggers Pusher event for the gift message automatically
            // Also deducts coins and adds 10% cashback to recipient

            // Update local tasks
            await taskService.updateTaskProgress(user.id, 'gift', 1);

            // Update PK points locally if needed, but optimally this should be on server soon.
            // For now, leaving the UI update part:
            if (activePKChallenge && activePKChallenge.status === 'active' && recipientId) {
              if (recipientId === activePKChallenge.user1Id) {
                await supabase
                  .from('pk_challenges')
                  .update({ user1_points: activePKChallenge.user1Points + gift.cost })
                  .eq('id', activePKChallenge.id);
              } else if (recipientId === activePKChallenge.user2Id) {
                await supabase
                  .from('pk_challenges')
                  .update({ user2_points: activePKChallenge.user2Points + gift.cost })
                  .eq('id', activePKChallenge.id);
              }
            }

            // Local notification trigger for legacy support, but server handles coins
            if (recipientId && recipientId !== user.id) {
              await notificationService.sendNotification(
                recipientId,
                'gift_arrival',
                `هدية جديدة من ${user.username}`,
                `لقد تلقيت ${gift.name} ${gift.iconUrl} في غرفة ${room?.name}`,
                { roomId: room?.id, giftId: gift.id, senderId: user.id }
              );
            }

          } catch (error) {
            console.error('Error sending gift:', error);
            alert("لا تملك رصيداً كافياً أو فشل الإرسال");
          }
        }}
      />

      <EmojiPanel
        isOpen={isEmojiPanelOpen}
        onClose={() => setIsEmojiPanelOpen(false)}
        onSend={(emoji) => handleSendMessage(emoji, "text")}
      />

      <GamePanel
        isOpen={isGamePanelOpen}
        onClose={() => setIsGamePanelOpen(false)}
        onPlay={async (choice) => {
          await handleSendMessage(`تحدى الجميع بـ ${choice}! 🎮`, "system");
          if (user) await taskService.updateTaskProgress(user.id, 'game', 1);
        }}
        onOpenWheel={() => setIsWheelOpen(true)}
        onOpenTrivia={() => setIsTriviaOpen(true)}
      />

      <WheelOfFortune
        isOpen={isWheelOpen}
        onClose={() => setIsWheelOpen(false)}
        userCoins={user?.coins || 0}
        onSpinStart={async (bet) => {
          if (!user) return;
          // Local task progress update
          await taskService.updateTaskProgress(user.id, 'game', 1);
        }}
        onWin={async (reward, bet) => {
          if (!user) return;
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;
            
            const response = await fetch('/api/game/wheel/spin', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ bet })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "فشل تشغيل العجلة");

            // Show message for winning
            if (result.reward.type !== 'nothing') {
              await handleSendMessage(`ربح ${result.reward.label} من عجلة الحظ! 🎡✨`, "system");
            }

            // Note: The AuthContext will automatically update user state via Supabase Realtime
            // or we could manually refresh if needed.
          } catch (error: any) {
            console.error('Spin result processing failed:', error);
            alert(error.message);
          }
        }}
      />

      <TriviaGame
        isOpen={isTriviaOpen}
        onClose={() => setIsTriviaOpen(false)}
        userCoins={user?.coins || 0}
        cost={100}
        onPlay={async () => {
          if (!user) return false;
          try {
            const { error } = await supabase
              .from('users')
              .update({ coins: user.coins - 100 })
              .eq('id', user.id);
            
            if (error) throw error;
            await taskService.updateTaskProgress(user.id, 'game', 1);
            return true;
          } catch (error) {
            console.error('Failed to deduct coins for trivia:', error);
            alert('فشل خصم العملات، يرجى المحاولة مرة أخرى');
            return false;
          }
        }}
        onWin={async (reward) => {
          if (!user) return;
          try {
            const newXp = (user.xp || 0) + reward.xp;
            let updates: any = {
              coins: user.coins + reward.coins,
              xp: newXp
            };

            if (newXp >= (user.nextLevelXp || 100)) {
              updates.level = (user.level || 1) + 1;
              updates.next_level_xp = Math.floor((user.nextLevelXp || 100) * 1.5);
              await handleSendMessage(`وصل إلى المستوى ${(user.level || 1) + 1}! 🎉`, "system");
            }

            await supabase
              .from('users')
              .update(updates)
              .eq('id', user.id);
            
            if (reward.coins > 0) {
              await handleSendMessage(`أكمل تحدي العباقرة وربح ${reward.coins} عملة! 🧠✨`, "system");
            }
          } catch (error) {
            console.error('Error handling trivia win:', error);
          }
        }}
      />

      <RoomAdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        room={room}
        seats={seats}
        userRole={myRole}
      />

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        userId={selectedUserId || ""}
        onStartChat={handleStartPrivateChat}
        onSendGift={(u) => {
          setGiftRecipient({ id: u.id, name: u.username });
          setIsUserModalOpen(false);
          setIsGiftPanelOpen(true);
        }}
        roomId={roomId}
        myRole={myRole}
        onWarn={handleWarn}
        onToggleShadowBan={handleToggleShadowBan}
        onUpdateRole={handleUpdateRole}
        onBanUser={handleBanUser}
        onUnbanUser={handleUnbanUser}
      />

      <PrivateChatList
        isOpen={isChatListOpen}
        onClose={() => setIsChatListOpen(false)}
        currentUser={user!}
        onSelectConversation={(id, other) => {
          setActiveConversationId(id);
          setActiveChatUser(other);
          setIsChatListOpen(false);
          setIsChatWindowOpen(true);
        }}
      />

      {/* Staff Chat Modal */}
      <AnimatePresence>
        {isStaffChatOpen && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsStaffChatOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md bg-neutral-900 rounded-t-[32px] sm:rounded-[32px] border-t sm:border border-white/10 overflow-hidden flex flex-col h-[70vh]"
              dir="rtl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-blue-500/10">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Shield className="w-6 h-6 text-blue-500" />
                  دردشة الطاقم
                </h3>
                <button onClick={() => setIsStaffChatOpen(false)} className="p-2 bg-neutral-800 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {staffMessages.map((msg) => (
                  <div key={msg.id} className={cn("flex flex-col", msg.userId === user?.id ? "items-start" : "items-end")}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-neutral-500">{msg.username}</span>
                    </div>
                    <div className={cn(
                      "px-4 py-2 rounded-2xl text-sm max-w-[80%]",
                      msg.userId === user?.id ? "bg-blue-500 text-white rounded-tr-none" : "bg-neutral-800 text-neutral-200 rounded-tl-none"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-white/5 bg-neutral-950/50">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.currentTarget.elements.namedItem('staffInput') as HTMLInputElement;
                    handleSendStaffMessage(input.value);
                    input.value = '';
                  }}
                  className="flex gap-2"
                >
                  <input
                    name="staffInput"
                    placeholder="رسالة للطاقم..."
                    className="flex-1 bg-neutral-800 border border-white/5 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                  />
                  <button type="submit" className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Warning Popup */}
      <AnimatePresence>
        {activeWarning && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-xs bg-neutral-900 rounded-[32px] border border-red-500/30 p-8 text-center shadow-2xl shadow-red-500/20"
            >
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell className="w-10 h-10 text-red-500 animate-bounce" />
              </div>
              <h3 className="text-2xl font-black text-red-500 mb-2">تحذير رسمي!</h3>
              <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
                لقد تلقيت تحذيراً من الإدارة بسبب:<br/>
                <span className="text-white font-bold mt-2 block bg-red-500/10 py-2 rounded-lg">
                  {activeWarning.reason || "مخالفة قوانين الغرفة"}
                </span>
              </p>
              <button
                onClick={() => setActiveWarning(null)}
                className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold shadow-lg shadow-red-500/30 active:scale-95 transition-all"
              >
                فهمت، سألتزم بالقوانين
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isMembersListOpen && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMembersListOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md bg-neutral-900 rounded-t-[32px] sm:rounded-[32px] border-t sm:border border-white/10 overflow-hidden flex flex-col max-h-[80vh]"
              dir="rtl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Users className="w-6 h-6 text-amber-500" />
                  أعضاء الغرفة ({members.length})
                </h3>
                <button onClick={() => setIsMembersListOpen(false)} className="p-2 bg-neutral-800 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Staff Section */}
                {members.filter(m => ['owner', 'admin', 'moderator', 'observer'].includes(m.role)).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mr-2">طاقم الغرفة</h4>
                    {members.filter(m => ['owner', 'admin', 'moderator', 'observer'].includes(m.role)).map((member) => (
                      <div 
                        key={member.id} 
                        className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer"
                        onClick={() => {
                          handleOpenUserModal(member.users.id);
                          setIsMembersListOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <UserAvatar username={member.users?.username} size="md" className={cn("border-2", getRoleColor(member.role).replace('text-', 'border-'))} />
                          <div>
                            <p className={cn("font-bold text-sm", getRoleColor(member.role))}>{member.users.username}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-500 rounded-md font-bold">
                                LV.{member.users.level}
                              </span>
                              <span className={cn("text-[10px] font-bold", getRoleColor(member.role))}>
                                {member.role === 'owner' ? 'صاحب الغرفة' : 
                                 member.role === 'admin' ? 'مسؤول' : 
                                 member.role === 'moderator' ? 'مشرف' : 
                                 member.role === 'observer' ? 'مراقب' : 'عضو'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {member.role === 'owner' && <Crown className="w-4 h-4 text-amber-500" />}
                          {['admin', 'moderator'].includes(member.role) && <Shield className={cn("w-4 h-4", getRoleColor(member.role))} />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Listeners Section */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mr-2">الأعضاء ({members.filter(m => m.role === 'listener').length})</h4>
                  {members.filter(m => m.role === 'listener').length > 0 ? (
                    members.filter(m => m.role === 'listener').map((member) => (
                      <div 
                        key={member.id} 
                        className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer"
                        onClick={() => {
                          handleOpenUserModal(member.users.id);
                          setIsMembersListOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <UserAvatar username={member.users?.username} size="md" />
                          <div>
                            <p className="font-bold text-sm">{member.users.username}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-500 rounded-md font-bold">
                                LV.{member.users.level}
                              </span>
                              <span className="text-[10px] text-neutral-500">عضو</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-neutral-600 text-xs italic">لا يوجد أعضاء آخرون</div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Waitlist Modal */}
      <AnimatePresence>
        {isWaitlistOpen && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWaitlistOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md bg-neutral-900 rounded-t-[32px] sm:rounded-[32px] border-t sm:border border-white/10 overflow-hidden flex flex-col max-h-[60vh]"
              dir="rtl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Clock className="w-6 h-6 text-amber-500" />
                  قائمة الانتظار ({waitlist.length})
                </h3>
                <button onClick={() => setIsWaitlistOpen(false)} className="p-2 bg-neutral-800 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {waitlist.map((entry, idx) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-500 font-bold text-xs">
                        {idx + 1}
                      </div>
                      <span className="text-sm font-bold">{entry.userId.slice(0, 8)}...</span>
                    </div>
                    <span className="text-[10px] text-neutral-500">{new Date(entry.createdAt).toLocaleTimeString('ar-EG')}</span>
                  </div>
                ))}
                {waitlist.length === 0 && (
                  <div className="text-center py-8 text-neutral-600 italic text-sm">القائمة فارغة حالياً</div>
                )}
              </div>

              <div className="p-4 border-t border-white/5">
                <button
                  onClick={handleJoinWaitlist}
                  disabled={waitlist.some(e => e.userId === user?.id)}
                  className="w-full bg-amber-500 text-black font-bold py-4 rounded-2xl disabled:opacity-50"
                >
                  {waitlist.some(e => e.userId === user?.id) ? "أنت في القائمة" : "الانضمام للقائمة"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Exit Confirmation Dialog */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExitConfirm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-xs bg-neutral-900 rounded-3xl border border-white/10 p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold mb-2">مغادرة الغرفة؟</h3>
              <p className="text-sm text-neutral-400 mb-6">هل أنت متأكد أنك تريد مغادرة الغرفة الحالية؟</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-3 bg-neutral-800 rounded-xl font-bold text-sm"
                >
                  إلغاء
                </button>
                <button
                  onClick={onExit}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/20"
                >
                  مغادرة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Entry Effects */}
      {activeEntryEffects.map(effect => (
        // @ts-ignore - Stubborn lint error regarding 'key' prop
        <EntryEffectRenderer
          key={effect.id}
          effectId={effect.effectId}
          username={effect.username}
          avatarUrl={effect.avatarUrl}
          frameId={effect.frameId}
          badgeId={effect.badgeId}
          onComplete={() => handleRemoveEntryEffect(effect.id)}
        />
      ))}
    </div>
  );
}
