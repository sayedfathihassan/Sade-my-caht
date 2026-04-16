import { useState, useEffect } from "react";
import { Room, Seat, RoomMember, User, RoomAuditLog, RoomPoll, RoomGiftGoal, RoomWarning, RoomStaffMessage } from "@/src/types";
import { supabase } from "@/src/lib/supabase";
import { motion, AnimatePresence } from "motion/react";
import { X, Settings, Shield, MicOff, Lock, Unlock, UserMinus, Save, Megaphone, Key, Users, Swords, Gift, Timer, Zap, Trash2, Plus, BarChart3, Music, Image as ImageIcon, History, Eye, EyeOff, Volume2, VolumeX, Clock } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { UserAvatar } from "./UserAvatar";

interface RoomAdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  seats: Seat[];
  userRole: RoomMember['role'];
}

export function RoomAdminPanel({ isOpen, onClose, room, seats, userRole }: RoomAdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'moderation' | 'seats' | 'features' | 'automod' | 'engagement' | 'appearance' | 'audit'>(
    (userRole === 'owner' || userRole === 'admin') ? 'settings' : 'moderation'
  );
  const [roomName, setRoomName] = useState(room.name);
  const [announcement, setAnnouncement] = useState(room.announcement || "");
  const [password, setPassword] = useState(room.password || "");
  const [roomType, setRoomType] = useState(room.type);
  const [isPKEnabled, setIsPKEnabled] = useState(room.isPKEnabled ?? true);
  const [welcomeMessage, setWelcomeMessage] = useState(room.welcomeMessage || "");
  const [backgroundUrl, setBackgroundUrl] = useState(room.backgroundUrl || "");
  const [backgroundMusicUrl, setBackgroundMusicUrl] = useState(room.backgroundMusicUrl || "");
  const [autoModSettings, setAutoModSettings] = useState(room.autoModSettings || {
    wordFilter: [],
    antiSpam: false,
    kickIdlers: false
  });
  const [wordFilterInput, setWordFilterInput] = useState("");
  const [seatNames, setSeatNames] = useState<Record<number, string>>(room.seatNames || {});
  
  const [isSaving, setIsSaving] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [bannedUsers, setBannedUsers] = useState<User[]>([]);
  const [isLoadingBanned, setIsLoadingBanned] = useState(false);
  const [isLockdown, setIsLockdown] = useState(room.isLockdown || false);
  const [slowModeDelay, setSlowModeDelay] = useState(room.slowModeDelay || 0);
  const [auditLogs, setAuditLogs] = useState<RoomAuditLog[]>([]);
  const [warnings, setWarnings] = useState<RoomWarning[]>([]);
  const [polls, setPolls] = useState<RoomPoll[]>([]);
  const [giftGoals, setGiftGoals] = useState<RoomGiftGoal[]>([]);
  
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTarget, setGoalTarget] = useState(10000);

  useEffect(() => {
    if (!isOpen || !room.id) return;

    const fetchBannedUsers = async () => {
      if (!room.bannedUsers || room.bannedUsers.length === 0) {
        setBannedUsers([]);
        return;
      }
      setIsLoadingBanned(true);
      try {
        const { data } = await supabase
          .from('users')
          .select('*')
          .in('id', room.bannedUsers);
        if (data) {
          setBannedUsers(data.map(u => ({
            id: u.id,
            username: u.username,
            email: u.email,
            avatarUrl: u.avatar_url,
            level: u.level,
            xp: u.xp,
            nextLevelXp: u.next_level_xp,
            coins: u.coins,
            diamonds: u.diamonds,
            inventory: u.inventory || [],
            isVerified: u.is_verified,
            isBanned: u.is_banned,
            role: u.role,
            followerCount: u.follower_count,
            followingCount: u.following_count,
            lastTaskResetAt: u.last_task_reset_at,
            createdAt: u.created_at,
            lastActiveAt: u.last_active_at,
          })));
        }
      } catch (error) {
        console.error("Failed to fetch banned users", error);
      } finally {
        setIsLoadingBanned(false);
      }
    };

    fetchBannedUsers();
  }, [isOpen, room.id, room.bannedUsers]);

  useEffect(() => {
    if (!isOpen || !room.id) return;

    const fetchMembers = async () => {
      const { data } = await supabase
        .from('room_members')
        .select('*, users(*)')
        .eq('room_id', room.id)
        .eq('is_active', true);
      
      if (data) {
        setMembers(data);
      }
    };

    fetchMembers();

    const fetchAuditLogs = async () => {
      const { data } = await supabase
        .from('room_audit_logs')
        .select('*')
        .eq('room_id', room.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setAuditLogs(data);
    };

    const fetchPolls = async () => {
      const { data } = await supabase
        .from('room_polls')
        .select('*, votes:room_poll_votes(*)')
        .eq('room_id', room.id)
        .order('created_at', { ascending: false });
      if (data) setPolls(data);
    };

    const fetchGiftGoals = async () => {
      const { data } = await supabase
        .from('room_gift_goals')
        .select('*')
        .eq('room_id', room.id)
        .eq('is_active', true);
      if (data) setGiftGoals(data);
    };

    fetchAuditLogs();
    fetchPolls();
    fetchGiftGoals();

    const sub = supabase
      .channel(`room_members_${room.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${room.id}` }, fetchMembers)
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [isOpen, room.id]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const updates = {
        name: roomName,
        announcement,
        password: roomType === 'private' ? password : "",
        type: roomType,
        is_pk_enabled: isPKEnabled,
        welcome_message: welcomeMessage,
        background_url: backgroundUrl,
        background_music_url: backgroundMusicUrl,
        auto_mod_settings: autoModSettings,
        seat_names: seatNames
      };

      await supabase
        .from('rooms')
        .update(updates)
        .eq('id', room.id);
      
      // Trigger real-time update
      await fetch('/api/room/settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id, settings: updates })
      });

      onClose();
    } catch (error) {
      console.error("Failed to update room settings", error);
    } finally {
      setIsSaving(false);
    }
  };

  const addAuditLog = async (action: string, details?: string, targetId?: string) => {
    try {
      const { data } = await supabase
        .from('room_audit_logs')
        .insert({
          room_id: room.id,
          admin_id: (await supabase.auth.getUser()).data.user?.id,
          action,
          details,
          target_id: targetId
        })
        .select()
        .single();
      
      if (data) {
        await fetch('/api/room/audit-log/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: room.id, log: data })
        });
      }
    } catch (error) {
      console.error("Failed to add audit log", error);
    }
  };

  const handleCreatePoll = async () => {
    if (!pollQuestion || pollOptions.some(o => !o)) return;
    try {
      const { data } = await supabase
        .from('room_polls')
        .insert({
          room_id: room.id,
          creator_id: (await supabase.auth.getUser()).data.user?.id,
          question: pollQuestion,
          options: pollOptions,
          status: 'active'
        })
        .select()
        .single();
      
      if (data) {
        await fetch('/api/room/poll/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: room.id, poll: data })
        });
        setPollQuestion("");
        setPollOptions(["", ""]);
        addAuditLog("إنشاء تصويت", pollQuestion);
      }
    } catch (error) {
      console.error("Failed to create poll", error);
    }
  };

  const handleClosePoll = async (pollId: string) => {
    try {
      await supabase
        .from('room_polls')
        .update({ status: 'closed' })
        .eq('id', pollId);
      addAuditLog("إغلاق تصويت", pollId);
    } catch (error) {
      console.error("Failed to close poll", error);
    }
  };

  const handleCreateGiftGoal = async () => {
    if (!goalTitle || goalTarget <= 0) return;
    try {
      const { data } = await supabase
        .from('room_gift_goals')
        .insert({
          room_id: room.id,
          title: goalTitle,
          target_amount: goalTarget,
          current_amount: 0,
          is_active: true
        })
        .select()
        .single();
      
      if (data) {
        await fetch('/api/room/gift-goal/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: room.id, goal: data })
        });
        setGoalTitle("");
        setGoalTarget(10000);
        addAuditLog("إنشاء هدف هدايا", goalTitle);
      }
    } catch (error) {
      console.error("Failed to create gift goal", error);
    }
  };

  const toggleSeatLock = async (seatId: string, currentLocked: boolean) => {
    await supabase
      .from('seats')
      .update({ is_locked: !currentLocked })
      .eq('id', seatId);
  };

  const toggleSeatMute = async (seatId: string, currentMuted: boolean) => {
    await supabase
      .from('seats')
      .update({ is_muted: !currentMuted })
      .eq('id', seatId);
  };

  const handleMuteAll = async () => {
    try {
      await supabase
        .from('seats')
        .update({ is_muted: true })
        .eq('room_id', room.id);
    } catch (error) {
      console.error("Failed to mute all seats", error);
    }
  };

  const handleLockAll = async () => {
    try {
      await supabase
        .from('seats')
        .update({ is_locked: true })
        .eq('room_id', room.id);
    } catch (error) {
      console.error("Failed to lock all seats", error);
    }
  };

  const handleUnlockAll = async () => {
    try {
      await supabase
        .from('seats')
        .update({ is_locked: false })
        .eq('room_id', room.id);
    } catch (error) {
      console.error("Failed to unlock all seats", error);
    }
  };

  const handleClearChat = async () => {
    try {
      await fetch('/api/room/clear-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id })
      });
    } catch (error) {
      console.error("Failed to clear chat", error);
    }
  };

  const handleKickUser = async (userId: string) => {
    if (userId === room.ownerId) return;
    try {
      await supabase
        .from('room_members')
        .update({ is_active: false })
        .eq('room_id', room.id)
        .eq('user_id', userId);
      
      // Also clear their seat if they are on one
      const userSeat = seats.find(s => s.userId === userId);
      if (userSeat) {
        await supabase
          .from('seats')
          .update({
            user_id: null,
            joined_at: null,
            is_muted: false
          })
          .eq('id', userSeat.id);
      }
    } catch (error) {
      console.error("Failed to kick user", error);
    }
  };

  const handleBanUser = async (userId: string) => {
    if (userId === room.ownerId) return;
    try {
      const newBanned = [...(room.bannedUsers || []), userId];
      await supabase
        .from('rooms')
        .update({ banned_users: newBanned })
        .eq('id', room.id);
      
      await handleKickUser(userId);

      // Trigger real-time update
      await fetch('/api/room/settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id, settings: { banned_users: newBanned } })
      });
    } catch (error) {
      console.error("Failed to ban user", error);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const newBanned = (room.bannedUsers || []).filter(id => id !== userId);
      await supabase
        .from('rooms')
        .update({ banned_users: newBanned })
        .eq('id', room.id);

      // Trigger real-time update
      await fetch('/api/room/settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id, settings: { banned_users: newBanned } })
      });
    } catch (error) {
      console.error("Failed to unban user", error);
    }
  };

  const handleUpdateMemberRole = async (userId: string, newRole: RoomMember['role']) => {
    try {
      await supabase
        .from('room_members')
        .update({ role: newRole })
        .eq('room_id', room.id)
        .eq('user_id', userId);

      // Trigger real-time update
      await fetch('/api/room/member/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room.id,
          memberId: userId,
          updates: { role: newRole }
        })
      });
    } catch (error) {
      console.error("Failed to update member role", error);
    }
  };

  const handleUpdateSlowMode = async (delay: number) => {
    try {
      await supabase.from('rooms').update({ slow_mode_delay: delay }).eq('id', room.id);
      await fetch('/api/room/slow-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id, delay })
      });
      setSlowModeDelay(delay);
    } catch (error) {
      console.error("Failed to update slow mode", error);
    }
  };

  const handleToggleLockdown = async () => {
    try {
      const newVal = !isLockdown;
      await supabase.from('rooms').update({ is_lockdown: newVal }).eq('id', room.id);
      await fetch('/api/room/lockdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id, isLockdown: newVal })
      });
      setIsLockdown(newVal);
    } catch (error) {
      console.error("Failed to toggle lockdown", error);
    }
  };

  const handleStartPK = async (u1: string, u2: string) => {
    if (!u1 || !u2 || u1 === u2) return;
    try {
      const endsAt = new Date();
      endsAt.setMinutes(endsAt.getMinutes() + 5);
      
      const { data, error } = await supabase
        .from('pk_challenges')
        .insert({
          room_id: room.id,
          user1_id: u1,
          user2_id: u2,
          user1_points: 0,
          user2_points: 0,
          status: 'active',
          duration: 300,
          started_at: new Date().toISOString(),
          ends_at: endsAt.toISOString()
        });
      
      if (!error && data) {
        // Update room with active PK ID
        await supabase.from('rooms').update({ active_pk_id: (data as any).id }).eq('id', room.id);
      }
    } catch (error) {
      console.error("Failed to start PK", error);
    }
  };

  const handleDropLuckyBox = async (amount: number, winners: number) => {
    if (amount <= 0 || winners <= 0) return;
    try {
      const { data, error } = await supabase
        .from('lucky_boxes')
        .insert({
          room_id: room.id,
          creator_id: room.ownerId,
          total_amount: amount,
          remaining_amount: amount,
          total_winners: winners,
          winners: [],
          status: 'active',
          created_at: new Date().toISOString()
        });

      if (!error && data) {
        await supabase.from('rooms').update({ active_lucky_box_id: (data as any).id }).eq('id', room.id);
      }
    } catch (error) {
      console.error("Failed to drop lucky box", error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="relative w-full max-w-lg bg-neutral-900 rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-xl">
                  <Shield className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">لوحة تحكم الغرفة</h2>
                  <p className="text-xs text-neutral-400">إدارة الإعدادات والمشرفين</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex p-2 gap-2 bg-black/20 mx-6 mt-4 rounded-2xl overflow-x-auto hide-scrollbar shrink-0">
              {[
                { id: 'settings', label: 'الإعدادات', icon: Settings, roles: ['owner', 'admin'] },
                { id: 'moderation', label: 'الرقابة', icon: Shield, roles: ['owner', 'admin', 'moderator', 'observer'] },
                { id: 'automod', label: 'الرقابة الآلية', icon: Zap, roles: ['owner', 'admin'] },
                { id: 'engagement', label: 'التفاعل', icon: BarChart3, roles: ['owner', 'admin', 'moderator'] },
                { id: 'seats', label: 'المقاعد', icon: MicOff, roles: ['owner', 'admin', 'moderator'] },
                { id: 'appearance', label: 'المظهر', icon: ImageIcon, roles: ['owner', 'admin'] },
                { id: 'audit', label: 'السجل', icon: History, roles: ['owner', 'admin'] },
              ].filter(t => t.roles.includes(userRole)).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "shrink-0 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all",
                    activeTab === tab.id 
                      ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" 
                      : "text-neutral-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 mr-1">اسم الغرفة</label>
                    <div className="relative">
                      <input
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 mr-1">الإعلان المثبت</label>
                    <div className="relative">
                      <Megaphone className="absolute right-4 top-3.5 w-4 h-4 text-neutral-500" />
                      <textarea
                        value={announcement}
                        onChange={(e) => setAnnouncement(e.target.value)}
                        placeholder="اكتب إعلاناً يظهر للجميع..."
                        className="w-full bg-black/40 border border-white/10 rounded-2xl pr-11 pl-4 py-3 text-sm focus:outline-none focus:border-amber-500/50 min-h-[100px] resize-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-neutral-400 mr-1">نوع الغرفة</label>
                      <select
                        value={roomType}
                        onChange={(e) => setRoomType(e.target.value as any)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50 appearance-none"
                      >
                        <option value="public">عامة</option>
                        <option value="private">خاصة (بكلمة مرور)</option>
                      </select>
                    </div>
                    {roomType === 'private' && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-400 mr-1">كلمة المرور</label>
                        <div className="relative">
                          <Key className="absolute right-4 top-3.5 w-4 h-4 text-neutral-500" />
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl pr-11 pl-4 py-3 text-sm focus:outline-none focus:border-amber-500/50"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-xl">
                        <Swords className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">تحديات الـ PK</p>
                        <p className="text-[10px] text-neutral-500">تفعيل أو تعطيل التحديات في الغرفة</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsPKEnabled(!isPKEnabled)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        isPKEnabled ? "bg-amber-500" : "bg-neutral-700"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        isPKEnabled ? "right-7" : "right-1"
                      )} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 mr-1">رسالة الترحيب</label>
                    <textarea
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      placeholder="رسالة تظهر للمستخدم عند دخوله الغرفة..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50 min-h-[80px] resize-none"
                    />
                  </div>

                  <button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="w-full bg-amber-500 text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    <span>{isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}</span>
                  </button>
                </div>
              )}

              {activeTab === 'moderation' && (
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleClearChat}
                      className="flex items-center justify-center gap-2 p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all text-xs font-bold"
                    >
                      <Zap className="w-4 h-4" />
                      مسح الدردشة
                    </button>
                    <button
                      onClick={handleMuteAll}
                      className="flex items-center justify-center gap-2 p-3 bg-neutral-800 text-neutral-400 rounded-2xl border border-white/5 hover:bg-neutral-700 hover:text-white transition-all text-xs font-bold"
                    >
                      <MicOff className="w-4 h-4" />
                      كتم الجميع
                    </button>
                  </div>

                  {/* Current Members */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-neutral-400 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      المتواجدون حالياً ({members.length})
                    </h3>
                    <div className="space-y-2">
                      {members.map((member) => (
                        <div key={member.id} className="flex flex-col gap-3 p-3 bg-black/20 rounded-2xl border border-white/5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <UserAvatar username={member.users.username} src={member.users.avatar_url} size="sm" />
                              <div>
                                <p className="text-sm font-bold">{member.users.username}</p>
                                <span className="text-[10px] text-amber-500 font-bold">
                                  {member.role === 'owner' ? 'صاحب الغرفة' : 
                                   member.role === 'admin' ? 'مسؤول' : 
                                   member.role === 'moderator' ? 'مشرف' : 
                                   member.role === 'observer' ? 'مراقب' : 'عضو'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {member.user_id !== room.ownerId && (
                                <>
                                  {(userRole === 'owner' || userRole === 'admin') && (
                                    <select
                                      value={member.role}
                                      onChange={(e) => handleUpdateMemberRole(member.user_id, e.target.value as any)}
                                      className="bg-neutral-800 border border-white/5 rounded-lg px-2 py-1 text-[10px] font-bold focus:outline-none"
                                    >
                                      <option value="listener">عضو</option>
                                      <option value="moderator">مشرف</option>
                                      <option value="observer">مراقب</option>
                                      <option value="admin">مسؤول</option>
                                    </select>
                                  )}
                                  {(userRole === 'owner' || userRole === 'admin' || userRole === 'moderator') && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleKickUser(member.user_id)}
                                        className="p-2 bg-orange-500/10 text-orange-500 rounded-xl hover:bg-orange-500/20 transition-colors"
                                        title="طرد"
                                      >
                                        <UserMinus className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleBanUser(member.user_id)}
                                        className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors"
                                        title="حظر نهائي"
                                      >
                                        <Shield className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Banned Users */}
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <h3 className="text-sm font-bold text-neutral-400 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-red-500" />
                      المستخدمون المحظورون ({bannedUsers.length})
                    </h3>
                    <div className="space-y-2">
                      {isLoadingBanned ? (
                        <div className="text-center py-4 text-neutral-500 text-xs">جاري التحميل...</div>
                      ) : bannedUsers.length > 0 ? (
                        bannedUsers.map((bannedUser) => (
                          <div key={bannedUser.id} className="flex items-center justify-between p-3 bg-black/20 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-3">
                              <UserAvatar username={bannedUser.username} src={bannedUser.avatarUrl} size="sm" />
                              <div>
                                <p className="text-sm font-bold">{bannedUser.username}</p>
                                <p className="text-[10px] text-neutral-500">ID: {bannedUser.id.slice(0, 8)}...</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleUnbanUser(bannedUser.id)}
                              className="px-4 py-2 bg-amber-500/10 text-amber-500 text-xs font-bold rounded-xl hover:bg-amber-500 hover:text-black transition-all"
                            >
                              فك الحظر
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-neutral-500 text-sm italic">
                          لا يوجد مستخدمون محظورون
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'seats' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleLockAll}
                      className="flex items-center justify-center gap-2 p-4 bg-neutral-800 text-neutral-400 rounded-2xl border border-white/5 hover:bg-neutral-700 hover:text-white transition-all text-sm font-bold"
                    >
                      <Lock className="w-5 h-5" />
                      قفل كافة المقاعد
                    </button>
                    <button
                      onClick={handleUnlockAll}
                      className="flex items-center justify-center gap-2 p-4 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20 hover:bg-amber-500 hover:text-black transition-all text-sm font-bold"
                    >
                      <Unlock className="w-5 h-5" />
                      فتح كافة المقاعد
                    </button>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-neutral-400 mr-1">إدارة المقاعد الفردية</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {seats.map((seat) => (
                        <div key={seat.id} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center text-xs font-bold text-neutral-400">
                              {seat.number}
                            </div>
                            <div>
                              <p className="text-sm font-bold">المقعد {seat.number}</p>
                              <p className="text-[10px] text-neutral-500">
                                {seat.userId ? `يشغله: ${seat.userId.slice(0, 8)}...` : 'متاح'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleSeatMute(seat.id, seat.isMuted)}
                              className={cn(
                                "p-2 rounded-xl transition-all",
                                seat.isMuted ? "bg-red-500 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                              )}
                              title={seat.isMuted ? "إلغاء الكتم" : "كتم المايك"}
                            >
                              <MicOff className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleSeatLock(seat.id, seat.isLocked)}
                              className={cn(
                                "p-2 rounded-xl transition-all",
                                seat.isLocked ? "bg-amber-500 text-black" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                              )}
                              title={seat.isLocked ? "فتح المقعد" : "قفل المقعد"}
                            >
                              {seat.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'automod' && (
                <div className="space-y-6">
                  <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                    <h3 className="text-sm font-bold text-amber-500 mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      الرقابة الآلية
                    </h3>
                    <p className="text-[10px] text-neutral-400">تساعدك هذه الأدوات في الحفاظ على نظام الغرفة تلقائياً.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                          <Lock className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">وضع الإغلاق (Lockdown)</p>
                          <p className="text-[10px] text-neutral-500">منع دخول أي مستخدم جديد للغرفة مؤقتاً</p>
                        </div>
                      </div>
                      <button
                        onClick={handleToggleLockdown}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                          isLockdown ? "bg-red-500 text-white" : "bg-neutral-700 text-neutral-300"
                        )}
                      >
                        {isLockdown ? "مفعل" : "معطل"}
                      </button>
                    </div>

                    <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                          <Clock className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">الوضع البطيء (Slow Mode)</p>
                          <p className="text-[10px] text-neutral-500">تحديد سرعة إرسال الرسائل (بالثواني)</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {[0, 5, 10, 30, 60].map(delay => (
                          <button
                            key={delay}
                            onClick={() => handleUpdateSlowMode(delay)}
                            className={cn(
                              "flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all",
                              slowModeDelay === delay 
                                ? "bg-blue-500/20 border-blue-500 text-blue-500" 
                                : "bg-neutral-900 border-white/5 text-neutral-500"
                            )}
                          >
                            {delay === 0 ? "معطل" : `${delay}ث`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                      <div>
                        <p className="text-sm font-bold">منع التكرار (Anti-Spam)</p>
                        <p className="text-[10px] text-neutral-500">منع إرسال الرسائل بسرعة كبيرة</p>
                      </div>
                      <button
                        onClick={() => setAutoModSettings({...autoModSettings, antiSpam: !autoModSettings.antiSpam})}
                        className={cn(
                          "w-12 h-6 rounded-full transition-all relative",
                          autoModSettings.antiSpam ? "bg-amber-500" : "bg-neutral-700"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                          autoModSettings.antiSpam ? "right-7" : "right-1"
                        )} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                      <div>
                        <p className="text-sm font-bold">طرد الخاملين</p>
                        <p className="text-[10px] text-neutral-500">طرد المستخدمين غير النشطين على المقاعد</p>
                      </div>
                      <button
                        onClick={() => setAutoModSettings({...autoModSettings, kickIdlers: !autoModSettings.kickIdlers})}
                        className={cn(
                          "w-12 h-6 rounded-full transition-all relative",
                          autoModSettings.kickIdlers ? "bg-amber-500" : "bg-neutral-700"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                          autoModSettings.kickIdlers ? "right-7" : "right-1"
                        )} />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-neutral-400 mr-1">فلتر الكلمات المحظورة</label>
                      <div className="flex gap-2">
                        <input
                          value={wordFilterInput}
                          onChange={(e) => setWordFilterInput(e.target.value)}
                          placeholder="أضف كلمة..."
                          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500/50"
                        />
                        <button
                          onClick={() => {
                            if (!wordFilterInput) return;
                            setAutoModSettings({
                              ...autoModSettings,
                              wordFilter: [...autoModSettings.wordFilter, wordFilterInput]
                            });
                            setWordFilterInput("");
                          }}
                          className="p-2 bg-amber-500 text-black rounded-xl"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {autoModSettings.wordFilter.map((word, i) => (
                          <span key={i} className="flex items-center gap-1 px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold border border-white/5">
                            {word}
                            <button onClick={() => setAutoModSettings({
                              ...autoModSettings,
                              wordFilter: autoModSettings.wordFilter.filter((_, idx) => idx !== i)
                            })}>
                              <X className="w-3 h-3 text-red-500" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'engagement' && (
                <div className="space-y-8">
                  {/* Polls Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-500" />
                      التصويتات
                    </h3>
                    <div className="bg-black/20 rounded-2xl p-4 border border-white/5 space-y-4">
                      <input
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                        placeholder="ما هو سؤال التصويت؟"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none"
                      />
                      <div className="space-y-2">
                        {pollOptions.map((opt, i) => (
                          <div key={i} className="flex gap-2">
                            <input
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...pollOptions];
                                newOpts[i] = e.target.value;
                                setPollOptions(newOpts);
                              }}
                              placeholder={`الخيار ${i + 1}`}
                              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none"
                            />
                            {pollOptions.length > 2 && (
                              <button onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} className="text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        {pollOptions.length < 5 && (
                          <button onClick={() => setPollOptions([...pollOptions, ""])} className="text-[10px] text-blue-500 font-bold flex items-center gap-1">
                            <Plus className="w-3 h-3" /> إضافة خيار
                          </button>
                        )}
                      </div>
                      <button
                        onClick={handleCreatePoll}
                        className="w-full bg-blue-500 text-white font-bold py-3 rounded-xl text-xs"
                      >
                        بدء التصويت
                      </button>
                    </div>

                    {/* Active Polls List */}
                    <div className="space-y-2">
                      {polls.filter(p => p.status === 'active').map(poll => (
                        <div key={poll.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold">{poll.question}</p>
                            <p className="text-[10px] text-neutral-500">{poll.options.length} خيارات</p>
                          </div>
                          <button onClick={() => handleClosePoll(poll.id)} className="text-[10px] text-red-500 font-bold">إغلاق</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Gift Goals Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Gift className="w-4 h-4 text-rose-500" />
                      أهداف الهدايا
                    </h3>
                    <div className="bg-black/20 rounded-2xl p-4 border border-white/5 space-y-4">
                      <input
                        value={goalTitle}
                        onChange={(e) => setGoalTitle(e.target.value)}
                        placeholder="عنوان الهدف (مثلاً: حفلة الغرفة)"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none"
                      />
                      <input
                        type="number"
                        value={goalTarget}
                        onChange={(e) => setGoalTarget(parseInt(e.target.value))}
                        placeholder="المبلغ المستهدف"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none"
                      />
                      <button
                        onClick={handleCreateGiftGoal}
                        className="w-full bg-rose-500 text-white font-bold py-3 rounded-xl text-xs"
                      >
                        تفعيل الهدف
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 mr-1">رابط خلفية الغرفة</label>
                    <div className="relative">
                      <ImageIcon className="absolute right-4 top-3.5 w-4 h-4 text-neutral-500" />
                      <input
                        value={backgroundUrl}
                        onChange={(e) => setBackgroundUrl(e.target.value)}
                        placeholder="رابط صورة (URL)..."
                        className="w-full bg-black/40 border border-white/10 rounded-2xl pr-11 pl-4 py-3 text-sm focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 mr-1">رابط موسيقى الخلفية</label>
                    <div className="relative">
                      <Music className="absolute right-4 top-3.5 w-4 h-4 text-neutral-500" />
                      <input
                        value={backgroundMusicUrl}
                        onChange={(e) => setBackgroundMusicUrl(e.target.value)}
                        placeholder="رابط ملف صوتي (MP3 URL)..."
                        className="w-full bg-black/40 border border-white/10 rounded-2xl pr-11 pl-4 py-3 text-sm focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'audit' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-neutral-400 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    سجل العمليات الإدارية
                  </h3>
                  <div className="space-y-2">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-black/20 rounded-2xl border border-white/5 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-amber-500">{log.action}</span>
                          <span className="text-[8px] text-neutral-600">{new Date(log.createdAt).toLocaleString('ar-EG')}</span>
                        </div>
                        <p className="text-xs text-neutral-300">{log.details}</p>
                        <p className="text-[8px] text-neutral-500">بواسطة: {log.adminId.slice(0, 8)}</p>
                      </div>
                    ))}
                    {auditLogs.length === 0 && (
                      <div className="text-center py-8 text-neutral-600 italic text-sm">لا توجد سجلات حالياً</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
