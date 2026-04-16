/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginScreen } from './components/LoginScreen';
import { RoomCard } from './components/RoomCard';
import { RoomView } from './components/RoomView';
import { CreateRoomModal } from './components/CreateRoomModal';
import { UserAvatar } from './components/UserAvatar';
import { Leaderboard } from './components/Leaderboard';
import { AdminDashboard } from './components/AdminDashboard';
import { DailyTasks } from './components/DailyTasks';
import { taskService } from './services/taskService';
import { supabase } from './lib/supabase';
import { Room } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Plus, Search, Trophy, Wallet, MessageSquare, Compass, User as UserIcon, LayoutDashboard, ShoppingBag, Box, ShieldAlert, X, Bell } from 'lucide-react';
import { PrivateChatList } from './components/PrivateChatList';
import { PrivateMessageWindow } from './components/PrivateMessageWindow';
import { chatService } from './services/chatService';
import { UserModal } from './components/UserModal';
import { FollowFeed } from './components/FollowFeed';
import { CreatePostModal } from './components/CreatePostModal';
import { EditProfileModal } from './components/EditProfileModal';
import { StoreModal } from './components/StoreModal';
import { InventoryModal } from './components/InventoryModal';
import { storeService } from './services/storeService';
import { notificationService } from './services/notificationService';
import { User, StoreItem, Notification } from './types';
import { NotificationPanel } from './components/NotificationPanel';
import { STORE_ITEMS } from './constants/storeItems';

import { EntryEffect } from './components/EntryEffect';

import { SearchModal } from './components/SearchModal';

function MainApp() {
  const { user, loading, signOut } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'explore' | 'profile'>('explore');
  const [isChatListOpen, setIsChatListOpen] = useState(false);
  const [isChatWindowOpen, setIsChatWindowOpen] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [feedTab, setFeedTab] = useState<'rooms' | 'feed'>('rooms');
  const [globalAnnouncement, setGlobalAnnouncement] = useState<{ text: string, author: string } | null>(null);
  const [globalEntryEffect, setGlobalEntryEffect] = useState<{ id: string, username: string } | null>(null);

  useEffect(() => {
    if (user && user.activeEntryEffectId) {
      setGlobalEntryEffect({ id: user.activeEntryEffectId, username: user.username });
    }
  }, [user?.id]); // Trigger once when user logs in

  useEffect(() => {
    const unsub = storeService.subscribeToItems(setStoreItems);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Check for daily task reset
    taskService.checkAndResetTasks(user.id, user.lastTaskResetAt);

    // Fetch rooms
    const fetchRooms = async () => {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('is_live', true)
          .limit(20);
        
        if (data) {
          setRooms(data as any);
        }
      } catch (e) {
        console.error("Failed to fetch rooms:", e);
      }
    };
    fetchRooms();

    // Real-time rooms
    const subscription = supabase
      .channel('rooms_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, fetchRooms)
      .subscribe();

    // Listen for notifications
    const unsubNotifications = notificationService.subscribeToNotifications(user.id, setNotifications);

    return () => {
      supabase.removeChannel(subscription);
      unsubNotifications();
    };
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    
    // Admin only logic if needed
  }, [user]);

  const handleNotificationAction = async (n: Notification) => {
    setIsNotificationsOpen(false);
    if (n.type === 'private_message' && n.data?.conversationId) {
      setIsChatListOpen(true);
    } else if (n.type === 'room_announcement' && n.data?.roomId) {
      setActiveRoomId(n.data.roomId);
    } else if (n.type === 'gift_arrival' && n.data?.roomId) {
      setActiveRoomId(n.data.roomId);
    }
  };

  useEffect(() => {
    const fetchAnnouncement = async () => {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'announcement')
        .single();
      if (data) setGlobalAnnouncement(data as any);
    };
    fetchAnnouncement();

    const sub = supabase
      .channel('settings_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'settings', filter: 'id=eq.announcement' }, (payload) => {
        setGlobalAnnouncement(payload.new as any);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

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

  const handleOpenUserModal = (userId: string) => {
    setSelectedUserId(userId);
    setIsUserModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-16 h-16 bg-amber-500 rounded-2xl"
        />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (activeRoomId) {
    return <RoomView roomId={activeRoomId} onExit={() => setActiveRoomId(null)} />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 pb-24" dir="rtl">
      {globalEntryEffect && (
        <EntryEffect
          effectId={globalEntryEffect.id}
          username={globalEntryEffect.username}
          onComplete={() => setGlobalEntryEffect(null)}
        />
      )}

      {/* Global Announcement */}
      <AnimatePresence>
        {globalAnnouncement && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-amber-500 text-xs font-bold">
                <ShieldAlert className="w-4 h-4" />
                <span>إعلان من {globalAnnouncement.author}:</span>
                <span className="text-white font-medium">{globalAnnouncement.text}</span>
              </div>
              <button 
                onClick={() => setGlobalAnnouncement(null)}
                className="text-neutral-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-900 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center font-black text-black shadow-lg shadow-amber-500/20">
              ص
            </div>
            <div>
              <h1 className="font-bold text-lg">صدى</h1>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <Wallet className="w-3 h-3 text-amber-500" />
                <span>{user.coins.toLocaleString()} عملة</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {user.isSuperAdmin && (
              <button 
                onClick={() => setIsAdminOpen(true)}
                className="p-2 bg-amber-500/10 text-amber-500 rounded-full hover:bg-amber-500 hover:text-black transition-all"
              >
                <LayoutDashboard className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={() => setIsStoreOpen(true)}
              className="p-2 bg-neutral-900 rounded-full text-neutral-400 hover:text-amber-500 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsTasksOpen(true)}
              className="p-2 bg-neutral-900 rounded-full text-neutral-400 hover:text-amber-500 transition-colors"
            >
              <Trophy className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsNotificationsOpen(true)}
              className="p-2 bg-neutral-900 rounded-full text-neutral-400 hover:text-amber-500 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-neutral-950">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-2 bg-neutral-900 rounded-full text-neutral-400 hover:text-neutral-50 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
            <button 
              onClick={signOut}
              className="p-2 bg-neutral-900 rounded-full text-neutral-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 mt-6">
        <AnimatePresence mode="wait">
          {activeTab === 'explore' ? (
            <motion.div
              key="explore"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Quick Stats */}
              <section className="grid grid-cols-2 gap-4 mb-8">
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsLeaderboardOpen(true)}
                  className="bg-gradient-to-br from-neutral-900 to-neutral-950 p-5 rounded-[28px] border border-neutral-800 shadow-xl cursor-pointer"
                >
                  <Trophy className="w-6 h-6 text-amber-500 mb-3" />
                  <h3 className="text-neutral-400 text-xs font-bold mb-1">المتصدرين</h3>
                  <p className="font-bold text-sm">عرض الترتيب اليومي</p>
                </motion.div>
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsChatListOpen(true)}
                  className="bg-gradient-to-br from-neutral-900 to-neutral-950 p-5 rounded-[28px] border border-neutral-800 shadow-xl cursor-pointer relative"
                >
                  <MessageSquare className="w-6 h-6 text-blue-500 mb-3" />
                  {totalUnread > 0 && (
                    <span className="absolute top-4 right-4 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-neutral-900">
                      {totalUnread}
                    </span>
                  )}
                  <h3 className="text-neutral-400 text-xs font-bold mb-1">الرسائل</h3>
                  <p className="font-bold text-sm">{totalUnread} رسائل جديدة</p>
                </motion.div>
              </section>

              {/* Feed Tabs */}
              <div className="flex items-center gap-4 mb-6 border-b border-white/5">
                <button
                  onClick={() => setFeedTab('rooms')}
                  className={cn(
                    "pb-3 text-sm font-bold transition-all relative",
                    feedTab === 'rooms' ? "text-white" : "text-neutral-500"
                  )}
                >
                  الغرف
                  {feedTab === 'rooms' && (
                    <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
                  )}
                </button>
                <button
                  onClick={() => setFeedTab('feed')}
                  className={cn(
                    "pb-3 text-sm font-bold transition-all relative",
                    feedTab === 'feed' ? "text-white" : "text-neutral-500"
                  )}
                >
                  اللحظات
                  {feedTab === 'feed' && (
                    <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
                  )}
                </button>
              </div>

              {feedTab === 'rooms' ? (
                /* Rooms Grid */
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">الغرف النشطة</h2>
                    <div className="flex gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-neutral-500 font-bold">مباشر</span>
                    </div>
                  </div>
                  
                  {rooms.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {rooms.map((room) => (
                        <RoomCard 
                          room={room} 
                          key={room.id}
                          onClick={() => setActiveRoomId(room.id)} 
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center text-neutral-600 border-2 border-dashed border-neutral-900 rounded-[32px] bg-neutral-900/20">
                      <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Plus className="w-8 h-8 text-neutral-700" />
                      </div>
                      <p className="font-bold">لا توجد غرف نشطة حالياً</p>
                      <p className="text-sm mt-1">كن أول من ينشئ غرفة ويجمع الأصدقاء!</p>
                    </div>
                  )}
                </section>
              ) : (
                <FollowFeed 
                  user={user} 
                  onOpenUser={handleOpenUserModal} 
                  onOpenCreatePost={() => setIsCreatePostOpen(true)}
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center py-12"
            >
              <div className="flex justify-center mb-6">
                <UserAvatar 
                  username={user.username} 
                  src={user.avatarUrl} 
                  size="xl" 
                  level={user.level}
                  frameUrl={user.activeFrameId}
                />
              </div>
              <h2 className="text-2xl font-bold">{user.username}</h2>
              <div className="flex items-center justify-center gap-2 mt-1 mb-4">
                {user.gender && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    user.gender === 'male' ? 'bg-blue-500/20 text-blue-400' : 
                    user.gender === 'female' ? 'bg-rose-500/20 text-rose-400' : 
                    'bg-neutral-500/20 text-neutral-400'
                  }`}>
                    {user.gender === 'male' ? 'ذكر' : user.gender === 'female' ? 'أنثى' : 'آخر'}
                  </span>
                )}
                {user.birthDate && (
                  <span className="text-[10px] bg-white/5 text-neutral-500 px-2 py-0.5 rounded-full font-bold">
                    {new Date().getFullYear() - new Date(user.birthDate).getFullYear()} سنة
                  </span>
                )}
              </div>
              
              <button 
                onClick={() => setIsEditProfileOpen(true)}
                className="bg-white/5 hover:bg-white/10 text-neutral-400 text-xs font-bold px-6 py-2 rounded-xl border border-white/5 transition-all mb-6"
              >
                تعديل الملف الشخصي
              </button>
              
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm mx-auto mt-8">
                <button 
                  onClick={() => setIsStoreOpen(true)}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black py-4 rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-amber-500/20"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>المتجر</span>
                </button>
                <button 
                  onClick={() => setIsInventoryOpen(true)}
                  className="flex items-center justify-center gap-2 bg-white/5 text-white font-black py-4 rounded-2xl hover:bg-white/10 transition-all border border-white/5"
                >
                  <Box className="w-5 h-5 text-blue-500" />
                  <span>حقيبتي</span>
                </button>
              </div>

              <div className="mt-8 max-w-xs mx-auto">
                <div className="flex justify-between text-[10px] font-bold text-neutral-500 mb-1 px-1">
                  <span>مستوى {user.level}</span>
                  <span>{user.xp} / {user.nextLevelXp} XP</span>
                </div>
                <div className="h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(user.xp / user.nextLevelXp) * 100}%` }}
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8 max-w-sm mx-auto">
                <div className="bg-neutral-900 p-4 rounded-2xl border border-white/5">
                  <p className="text-xl font-bold text-white">{user.followerCount || 0}</p>
                  <p className="text-[10px] text-neutral-500">متابعين</p>
                </div>
                <div className="bg-neutral-900 p-4 rounded-2xl border border-white/5">
                  <p className="text-xl font-bold text-white">{user.followingCount || 0}</p>
                  <p className="text-[10px] text-neutral-500">يتابع</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 max-w-sm mx-auto">
                <div className="bg-neutral-900 p-4 rounded-2xl border border-white/5">
                  <p className="text-xl font-bold text-amber-500">{user.level}</p>
                  <p className="text-[10px] text-neutral-500">المستوى</p>
                </div>
                <div className="bg-neutral-900 p-4 rounded-2xl border border-white/5">
                  <p className="text-xl font-bold text-yellow-500">{user.coins}</p>
                  <p className="text-[10px] text-neutral-500">العملات</p>
                </div>
                <div className="bg-neutral-900 p-4 rounded-2xl border border-white/5">
                  <p className="text-xl font-bold text-blue-400">{user.diamonds}</p>
                  <p className="text-[10px] text-neutral-500">الألماس</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-950/90 backdrop-blur-2xl border-t border-neutral-900 px-8 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button 
            onClick={() => setActiveTab('explore')}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              activeTab === 'explore' ? "text-amber-500" : "text-neutral-500"
            )}
          >
            <Compass className="w-6 h-6" />
            <span className="text-[10px] font-bold">استكشف</span>
          </button>
          
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="w-14 h-14 bg-amber-500 rounded-full -mt-12 shadow-2xl shadow-amber-500/40 flex items-center justify-center text-black active:scale-90 transition-transform border-4 border-neutral-950"
          >
            <Plus className="w-8 h-8" />
          </button>

          <button 
            onClick={() => setActiveTab('profile')}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              activeTab === 'profile' ? "text-amber-500" : "text-neutral-500"
            )}
          >
            <UserIcon className="w-6 h-6" />
            <span className="text-[10px] font-bold">حسابي</span>
          </button>
        </div>
      </nav>

      <CreateRoomModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(id) => setActiveRoomId(id)}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectRoom={(id) => {
          setActiveRoomId(id);
          setIsSearchOpen(false);
        }}
        onSelectUser={(id) => {
          handleOpenUserModal(id);
          setIsSearchOpen(false);
        }}
      />

      <AnimatePresence>
        {isLeaderboardOpen && (
          <Leaderboard onClose={() => setIsLeaderboardOpen(false)} />
        )}
        {isTasksOpen && (
          <DailyTasks user={user} onClose={() => setIsTasksOpen(false)} />
        )}
      </AnimatePresence>

      <PrivateChatList
        isOpen={isChatListOpen}
        onClose={() => setIsChatListOpen(false)}
        currentUser={user}
        onSelectConversation={(id, other) => {
          setActiveConversationId(id);
          setActiveChatUser(other);
          setIsChatListOpen(false);
          setIsChatWindowOpen(true);
        }}
      />

      {activeChatUser && activeConversationId && (
        <PrivateMessageWindow
          isOpen={isChatWindowOpen}
          onClose={() => setIsChatWindowOpen(false)}
          currentUser={user}
          otherUser={activeChatUser}
          conversationId={activeConversationId}
        />
      )}

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        userId={selectedUserId || ""}
        onStartChat={handleStartPrivateChat}
        onSendGift={(u) => {
          setIsUserModalOpen(false);
          setIsStoreOpen(true);
        }}
      />

      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        user={user}
        onSuccess={() => {}}
      />

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        user={user}
      />

      <StoreModal
        isOpen={isStoreOpen}
        onClose={() => setIsStoreOpen(false)}
        user={user}
      />

      <NotificationPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        userId={user.id}
        onAction={handleNotificationAction}
      />

      <InventoryModal
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        user={user}
      />

      <AdminDashboard 
        isOpen={isAdminOpen} 
        onClose={() => setIsAdminOpen(false)} 
      />
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}


export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}

