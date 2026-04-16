import React, { useState, useEffect } from "react";
import { User, Room, Gift, StoreItem, Event, Task } from "@/src/types";
import { supabase } from "@/src/lib/supabase";
import { motion, AnimatePresence } from "motion/react";
import { Users, LayoutDashboard, Gift as GiftIcon, ShieldAlert, Search, Ban, CheckCircle, Trash2, Plus, X, TrendingUp, DollarSign, MessageSquare, Trophy, Star, ShoppingBag, Gem, Edit2, Save, RefreshCw, Coins, Calendar, Image as ImageIcon, Settings, ShieldCheck } from "lucide-react";
import { formatNumber, cn } from "@/src/lib/utils";
import { DAILY_TASKS } from "@/src/services/taskService";
import { STORE_ITEMS } from "@/src/constants/storeItems";
import { storeService } from "@/src/services/storeService";
import { eventService } from "@/src/services/eventService";

export function AdminDashboard({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'rooms' | 'gifts' | 'tasks' | 'events' | 'store' | 'rewards' | 'settings' | 'logs'>('stats');
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingGift, setIsAddingGift] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [isSeeding, setIsSeeding] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false);
  const [editingUserBalance, setEditingUserBalance] = useState<{ userId: string, type: 'coins' | 'diamonds' | 'level' | 'xp', value: number } | null>(null);
  const [isAddingStoreItem, setIsAddingStoreItem] = useState(false);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [selectedUserForInventory, setSelectedUserForInventory] = useState<User | null>(null);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [newGiftForm, setNewGiftForm] = useState<Partial<Gift>>({
    name: "",
    iconUrl: "",
    animationUrl: "",
    cost: 0,
    category: "gifts",
    isActive: true
  });
  const [newEventForm, setNewEventForm] = useState<Partial<Event>>({
    title: "",
    description: "",
    bannerUrl: "",
    startAt: new Date().toISOString().split('T')[0],
    endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tasks: [],
    isActive: true
  });
  const [newItemForm, setNewItemForm] = useState<Partial<StoreItem>>({
    name: "",
    description: "",
    price: 0,
    currency: "coins",
    category: "frame",
    imageUrl: ""
  });
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [newRoomForm, setNewRoomForm] = useState<Partial<Room>>({
    name: "",
    description: "",
    type: "public",
    maxSeats: 6,
    coverUrl: "",
    backgroundTheme: "default",
    ownerId: ""
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewardRules, setRewardRules] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<any[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isAddingRewardRule, setIsAddingRewardRule] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState<Partial<Task>>({
    title: "",
    description: "",
    target: 0,
    rewardCoins: 0,
    rewardXp: 0,
    type: "chat",
    frequency: "daily",
    isActive: true
  });
  const [newRewardRuleForm, setNewRewardRuleForm] = useState<any>({
    name: "",
    type: "spending_cashback",
    triggerValue: 0,
    rewardValue: 0,
    isActive: true
  });

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('users').select('*');
      if (data) setUsers(data.map(mapUser));
    };
    fetchUsers();

    const fetchRooms = async () => {
      const { data } = await supabase.from('rooms').select('*');
      if (data) setRooms(data.map(mapRoom));
    };
    fetchRooms();

    const fetchStore = async () => {
      const items = await storeService.getItems();
      setStoreItems(items);
    };
    fetchStore();

    const fetchEvents = async () => {
      const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false });
      if (data) setEvents(data.map(eventService.mapEvent));
    };
    fetchEvents();

    const fetchGifts = async () => {
      const { data } = await supabase.from('gifts').select('*').order('cost', { ascending: true });
      if (data) setGifts(data as Gift[]);
    };
    fetchGifts();

    const fetchLogs = async () => {
      const { data } = await supabase.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(50);
      if (data) setLogs(data);
    };
    fetchLogs();

    const fetchTasks = async () => {
      const { data } = await supabase.from('tasks').select('*');
      if (data) {
        setTasks(data.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          target: t.target,
          rewardCoins: t.reward_coins,
          rewardXp: t.reward_xp,
          type: t.type as any,
          frequency: t.frequency as any,
          isActive: t.is_active
        })));
      }
    };
    fetchTasks();

    const fetchRewardRules = async () => {
      const { data } = await supabase.from('reward_rules').select('*');
      if (data) setRewardRules(data);
    };
    fetchRewardRules();

    const fetchSystemSettings = async () => {
      const { data } = await supabase.from('system_settings').select('*');
      if (data) setSystemSettings(data);
    };
    fetchSystemSettings();

    const usersSub = supabase.channel('users_admin').on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchUsers).subscribe();
    const roomsSub = supabase.channel('rooms_admin').on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, fetchRooms).subscribe();
    const storeSub = supabase.channel('store_admin').on('postgres_changes', { event: '*', schema: 'public', table: 'store_items' }, fetchStore).subscribe();
    const eventsSub = supabase.channel('events_admin').on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, fetchEvents).subscribe();
    const giftsSub = supabase.channel('gifts_admin').on('postgres_changes', { event: '*', schema: 'public', table: 'gifts' }, fetchGifts).subscribe();
    const tasksSub = supabase.channel('tasks_admin').on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks).subscribe();
    const rewardsSub = supabase.channel('rewards_admin').on('postgres_changes', { event: '*', schema: 'public', table: 'reward_rules' }, fetchRewardRules).subscribe();
    const settingsSub = supabase.channel('settings_admin').on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, fetchSystemSettings).subscribe();

    return () => {
      supabase.removeChannel(usersSub);
      supabase.removeChannel(roomsSub);
      supabase.removeChannel(storeSub);
      supabase.removeChannel(eventsSub);
      supabase.removeChannel(giftsSub);
      supabase.removeChannel(tasksSub);
      supabase.removeChannel(rewardsSub);
      supabase.removeChannel(settingsSub);
    };
  }, []);

  const mapUser = (data: any): User => ({
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
  });

  const mapRoom = (data: any): Room => ({
    id: data.id,
    ownerId: data.owner_id,
    name: data.name,
    description: data.description,
    coverUrl: data.cover_url,
    type: data.type,
    password: data.password,
    maxSeats: data.max_seats,
    isLive: data.is_live,
    backgroundTheme: data.background_theme,
    memberCount: data.member_count,
    totalGifts: data.total_gifts,
    announcement: data.announcement,
    bannedUsers: data.banned_users,
    isPKEnabled: data.is_pk_enabled ?? true,
    createdAt: data.created_at,
  });

  const handleSeedStore = async () => {
    if (!confirm("هل تريد استيراد المنتجات الافتراضية للمتجر؟")) return;
    setIsSeeding(true);
    try {
      const { error } = await supabase.from('store_items').upsert(STORE_ITEMS);
      if (error) throw error;
      alert("تم استيراد المنتجات بنجاح");
    } catch (error) {
      console.error("Seeding failed", error);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSaveBalance = async () => {
    if (!editingUserBalance) return;
    const { userId, type, value } = editingUserBalance;

    try {
      await supabase
        .from('users')
        .update({ [type]: value })
        .eq('id', userId);
      setEditingUserBalance(null);
      alert("تم تحديث الرصيد بنجاح");
    } catch (error: any) {
      console.error("Failed to update balance", error);
      alert("فشل التحديث");
    }
  };

  const handleAddGift = async () => {
    if (!newGiftForm.name || !newGiftForm.iconUrl || !newGiftForm.cost) {
      alert("يرجى تعبئة الحقول المطلوبة للهدايا");
      return;
    }

    try {
      const { error } = await supabase.from('gifts').insert([{
        name: newGiftForm.name,
        icon_url: newGiftForm.iconUrl,
        animation_url: newGiftForm.animationUrl || "",
        cost: newGiftForm.cost,
        category: newGiftForm.category || "gifts",
        is_active: true
      }]);

      if (error) throw error;
      alert("تمت إضافة الهدية بنجاح");
      setIsAddingGift(false);
      setNewGiftForm({ name: "", iconUrl: "", animationUrl: "", cost: 0, category: "gifts", isActive: true });
    } catch (error) {
      console.error("Failed to add gift", error);
      alert("فشل إضافة الهدية");
    }
  };

  const handleDeleteGift = async (giftId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الهدية؟")) return;
    await supabase.from('gifts').delete().eq('id', giftId);
  };

  const logAdminAction = async (action: string, details: string) => {
    try {
      await supabase.from('admin_logs').insert([{
        admin_id: 'owner', // In a real app, this would be the logged-in admin's ID
        admin_name: "المالك العام",
        action,
        details,
        created_at: new Date().toISOString()
      }]);
    } catch (error) {
      console.error("Failed to log admin action", error);
    }
  };

  const handleUpdateUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`هل تريد تغيير رتبة المستخدم إلى ${newRole === 'admin' ? 'مدير' : 'مستخدم'}؟`)) return;
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId);
    if (!error) {
      const user = users.find(u => u.id === userId);
      await logAdminAction('role_change', `تغيير رتبة ${user?.username || userId} إلى ${newRole}`);
    }
  };

  const handleRemoveFromInventory = async (userId: string, itemId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newInventory = user.inventory.filter(i => i.itemId !== itemId);
    try {
      await supabase.from('users').update({ inventory: newInventory }).eq('id', userId);
      alert("تم حذف العنصر من الحقيبة");
    } catch (error) {
      console.error("Failed to remove from inventory", error);
    }
  };

  const handleAddToInventory = async (userId: string, itemId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (user.inventory.some(i => i.itemId === itemId)) {
      alert("المستخدم يمتلك هذا العنصر بالفعل");
      return;
    }

    const newInventory = [...user.inventory, { itemId, purchasedAt: new Date().toISOString() }];
    try {
      await supabase.from('users').update({ inventory: newInventory }).eq('id', userId);
      alert("تمت إضافة العنصر للحقيبة");
    } catch (error) {
      console.error("Failed to add to inventory", error);
    }
  };

  const handleQuickAdd = async (userId: string, type: 'coins' | 'diamonds' | 'level' | 'xp') => {
    const labels = { coins: 'العملات', diamonds: 'الألماس', level: 'المستوى', xp: 'الخبرة' };
    const amountStr = prompt(`كم تريد أن تزيد ${labels[type]}؟`, "1000");
    if (!amountStr) return;
    
    const val = parseInt(amountStr);
    if (isNaN(val)) return;

    const currentVal = users.find(u => u.id === userId)?.[type] || 0;
    const newAmount = currentVal + val;

    try {
      await supabase
        .from('users')
        .update({ [type]: newAmount })
        .eq('id', userId);
      alert(`تمت إضافة ${val} بنجاح`);
    } catch (error: any) {
      console.error("Failed to add balance", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم نهائياً؟")) return;
    const user = users.find(u => u.id === userId);
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (!error) {
      await logAdminAction('delete_user', `حذف المستخدم ${user?.username || userId}`);
    }
  };

  const handleUpdatePrice = async (itemId: string) => {
    await storeService.updateItemPrice(itemId, editPrice);
    setEditingItemId(null);
    // Refresh store items
    const items = await storeService.getItems();
    setStoreItems([...items]);
  };

  const handleAddStoreItem = async () => {
    if (!newItemForm.name || !newItemForm.price || !newItemForm.imageUrl) {
      alert("يرجى تعبئة الحقول المطلوبة (الاسم، السعر، رابط الصورة)");
      return;
    }
    
    const newItem: StoreItem = {
      id: `item_${Date.now()}`,
      name: newItemForm.name!,
      description: newItemForm.description || "",
      price: newItemForm.price!,
      currency: newItemForm.currency as 'coins' | 'diamonds',
      category: newItemForm.category as 'frame' | 'entry_effect' | 'badge',
      imageUrl: newItemForm.imageUrl!
    };

    try {
      await storeService.addItem(newItem);
      alert("تمت إضافة العنصر بنجاح");
      setIsAddingStoreItem(false);
      setNewItemForm({ name: "", description: "", price: 0, currency: "coins", category: "frame", imageUrl: "" });
      // Refresh store items
      const items = await storeService.getItems();
      setStoreItems([...items]);
    } catch (error) {
      console.error("Failed to add store item", error);
      alert("فشل إضافة العنصر");
    }
  };

  const handleBanUser = async (userId: string, isBanned: boolean) => {
    const { error } = await supabase.from('users').update({ is_banned: !isBanned }).eq('id', userId);
    if (!error) {
      const user = users.find(u => u.id === userId);
      await logAdminAction('ban', `${!isBanned ? 'حظر' : 'إلغاء حظر'} المستخدم ${user?.username || userId}`);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الغرفة؟")) return;
    await supabase.from('rooms').delete().eq('id', roomId);
  };

  const handleAddTask = async () => {
    if (!newTaskForm.title || !newTaskForm.target) {
      alert("يرجى تعبئة الحقول المطلوبة للمهمة");
      return;
    }

    try {
      const { error } = await supabase.from('tasks').insert([{
        title: newTaskForm.title,
        description: newTaskForm.description || "",
        target: newTaskForm.target,
        reward_coins: newTaskForm.rewardCoins || 0,
        reward_xp: newTaskForm.rewardXp || 0,
        type: newTaskForm.type,
        frequency: newTaskForm.frequency || "daily",
        is_active: true
      }]);

      if (error) throw error;
      setIsAddingTask(false);
      setNewTaskForm({ title: "", description: "", target: 0, rewardCoins: 0, rewardXp: 0, type: "chat", frequency: "daily" });
      alert("تمت إضافة المهمة بنجاح");
    } catch (error) {
      console.error("Failed to add task", error);
      alert("فشل إضافة المهمة");
    }
  };

  const handleAddRewardRule = async () => {
    if (!newRewardRuleForm.name || !newRewardRuleForm.triggerValue) {
      alert("يرجى تعبئة الحقول المطلوبة للقاعدة");
      return;
    }

    try {
      const { error } = await supabase.from('reward_rules').insert([{
        name: newRewardRuleForm.name,
        type: newRewardRuleForm.type,
        trigger_value: newRewardRuleForm.triggerValue,
        reward_value: newRewardRuleForm.rewardValue,
        is_active: true
      }]);

      if (error) throw error;
      setIsAddingRewardRule(false);
      setNewRewardRuleForm({ name: "", type: "spending_cashback", triggerValue: 0, rewardValue: 0, isActive: true });
      alert("تمت إضافة قاعدة المكافأة بنجاح");
    } catch (error) {
      console.error("Failed to add reward rule", error);
      alert("فشل إضافة القاعدة");
    }
  };

  const handleDeleteRewardRule = async (ruleId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه القاعدة؟")) return;
    await supabase.from('reward_rules').delete().eq('id', ruleId);
  };

  const handleUpdateSystemSetting = async (key: string, value: any) => {
    try {
      const { error } = await supabase.from('system_settings').upsert([{ key, value }]);
      if (error) throw error;
      alert("تم تحديث الإعداد بنجاح");
    } catch (error) {
      console.error("Failed to update setting", error);
      alert("فشل تحديث الإعداد");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه المهمة؟")) return;
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      alert("تم حذف المهمة بنجاح");
    } catch (error) {
      console.error("Failed to delete task", error);
      alert("فشل حذف المهمة");
    }
  };

  const handleSeedTasks = async () => {
    if (!confirm("هل تريد استيراد المهام الافتراضية؟")) return;
    try {
      const tasksToSeed = DAILY_TASKS.map(t => ({
        title: t.title,
        description: t.description,
        target: t.target,
        reward_coins: t.rewardCoins,
        reward_xp: t.rewardXp,
        type: t.type,
        is_active: true
      }));
      const { error } = await supabase.from('tasks').insert(tasksToSeed);
      if (error) throw error;
      alert("تم استيراد المهام بنجاح");
    } catch (error) {
      console.error("Failed to seed tasks", error);
      alert("فشل استيراد المهام");
    }
  };
  const handleAddRoom = async () => {
    if (!newRoomForm.name) {
      alert("يرجى إدخال اسم الغرفة");
      return;
    }
    
    const { data, error } = await supabase.from('rooms').insert([{
      name: newRoomForm.name,
      description: newRoomForm.description || "",
      type: newRoomForm.type || "public",
      max_seats: newRoomForm.maxSeats || 6,
      cover_url: newRoomForm.coverUrl || "",
      background_theme: newRoomForm.backgroundTheme || "default",
      owner_id: newRoomForm.ownerId || '00000000-0000-0000-0000-000000000000',
      is_live: true,
      member_count: 0
    }]).select().single();

    if (!error && data) {
      // Create seats for the new room
      const seatsToInsert = Array.from({ length: newRoomForm.maxSeats || 6 }).map((_, i) => ({
        room_id: data.id,
        number: i + 1,
        is_locked: false,
        is_muted: false
      }));
      await supabase.from('seats').insert(seatsToInsert);
      
      setIsAddingRoom(false);
      setNewRoomForm({
        name: "",
        description: "",
        type: "public",
        maxSeats: 6,
        coverUrl: "",
        backgroundTheme: "default"
      });
      alert("تم إنشاء الغرفة بنجاح");
      await logAdminAction('create_room', `إنشاء غرفة جديدة: ${newRoomForm.name}`);
    } else if (error) {
      console.error("Failed to add room", error);
      alert("فشل إنشاء الغرفة: " + error.message);
    }
  };

  const handleAddEvent = async () => {
    if (!newEventForm.title || !newEventForm.startAt || !newEventForm.endAt) {
      alert("يرجى تعبئة الحقول الأساسية للفعالية");
      return;
    }

    try {
      await eventService.createEvent(newEventForm);
      alert("تمت إضافة الفعالية بنجاح");
      setIsAddingEvent(false);
      setNewEventForm({
        title: "",
        description: "",
        bannerUrl: "",
        startAt: new Date().toISOString().split('T')[0],
        endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tasks: [],
        isActive: true
      });
    } catch (error) {
      console.error("Failed to add event", error);
      alert("فشل إضافة الفعالية");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الفعالية؟")) return;
    await supabase.from('events').delete().eq('id', eventId);
  };

  const handleToggleEvent = async (eventId: string, currentStatus: boolean) => {
    await supabase.from('events').update({ is_active: !currentStatus }).eq('id', eventId);
  };

  const handleAddTaskToEvent = () => {
    const newTask: Task = {
      id: `task_${Date.now()}`,
      title: "مهمة جديدة",
      description: "وصف المهمة",
      target: 10,
      rewardCoins: 1000,
      rewardXp: 200,
      type: 'chat',
      frequency: 'daily',
      isActive: true
    };
    setNewEventForm({
      ...newEventForm,
      tasks: [...(newEventForm.tasks || []), newTask]
    });
  };

  const handleUpdateEventTask = (index: number, field: keyof Task, value: any) => {
    const updatedTasks = [...(newEventForm.tasks || [])];
    updatedTasks[index] = { ...updatedTasks[index], [field]: value };
    setNewEventForm({ ...newEventForm, tasks: updatedTasks });
  };

  const handleRemoveEventTask = (index: number) => {
    const updatedTasks = [...(newEventForm.tasks || [])];
    updatedTasks.splice(index, 1);
    setNewEventForm({ ...newEventForm, tasks: updatedTasks });
  };

  const handleSendAnnouncement = async () => {
    if (!announcement.trim()) return;
    setIsSendingAnnouncement(true);
    try {
      await supabase
        .from('settings')
        .upsert([{
          id: 'announcement',
          value: {
            text: announcement,
            author: "الإدارة",
            created_at: new Date().toISOString()
          }
        }]);
      alert("تم إرسال الإعلان بنجاح");
      setAnnouncement("");
    } catch (error) {
      console.error("Failed to send announcement", error);
    } finally {
      setIsSendingAnnouncement(false);
    }
  };

  const totalCoins = users.reduce((acc, u) => acc + (u.coins || 0), 0);
  const totalDiamonds = users.reduce((acc, u) => acc + (u.diamonds || 0), 0);

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end" dir="rtl">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Content */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full md:w-[85%] lg:w-[75%] h-full bg-neutral-950 shadow-2xl flex flex-col md:flex-row overflow-hidden"
          >
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-neutral-900 border-l border-white/5 p-6 flex flex-col gap-6 md:gap-8 overflow-y-auto">
              <div className="flex items-center justify-between md:justify-start gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                    <ShieldAlert className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">لوحة الإدارة</h1>
                    <div className="flex flex-col">
                      <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">المالك العام</p>
                    </div>
                  </div>
                </div>
                <button onClick={onClose} className="md:hidden p-2 hover:bg-white/5 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 no-scrollbar">
                <SidebarItem active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<LayoutDashboard className="w-5 h-5" />} label="الإحصائيات" />
                <SidebarItem active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users className="w-5 h-5" />} label="المستخدمين" />
                <SidebarItem active={activeTab === 'rooms'} onClick={() => setActiveTab('rooms')} icon={<MessageSquare className="w-5 h-5" />} label="الغرف" />
                <SidebarItem active={activeTab === 'gifts'} onClick={() => setActiveTab('gifts')} icon={<GiftIcon className="w-5 h-5" />} label="الهدايا" />
                <SidebarItem active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon={<Trophy className="w-5 h-5" />} label="المهام" />
                <SidebarItem active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')} icon={<Star className="w-5 h-5" />} label="المكافآت" />
                <SidebarItem active={activeTab === 'events'} onClick={() => setActiveTab('events')} icon={<Calendar className="w-5 h-5" />} label="الفعاليات" />
                <SidebarItem active={activeTab === 'store'} onClick={() => setActiveTab('store')} icon={<ShoppingBag className="w-5 h-5" />} label="المتجر" />
                <SidebarItem active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<ShieldCheck className="w-5 h-5" />} label="السجلات" />
                <SidebarItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings className="w-5 h-5" />} label="الإعدادات" />
              </nav>

              <div className="mt-auto space-y-4 hidden md:block">
                <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase">حالة النظام</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-neutral-400 flex justify-between"><span>الخادم:</span> <span className="text-green-500">متصل</span></p>
                    <p className="text-[10px] text-neutral-400 flex justify-between"><span>قاعدة البيانات:</span> <span className="text-green-500">مستقرة</span></p>
                  </div>
                </div>

                <button onClick={onClose} className="w-full flex items-center gap-3 p-3 text-neutral-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                  <span>إغلاق اللوحة</span>
                </button>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-10 pb-24 md:pb-10">
              <AnimatePresence mode="wait">
          {activeTab === 'stats' && (
            <motion.div key="stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="إجمالي المستخدمين" value={users.length} icon={<Users />} color="blue" />
                <StatCard label="الغرف النشطة" value={rooms.length} icon={<MessageSquare />} color="amber" />
                <StatCard label="العملات المتداولة" value={totalCoins} icon={<Coins />} color="amber" />
                <StatCard label="الألماس المتداول" value={totalDiamonds} icon={<Gem />} color="rose" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-8">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    نظرة عامة على النظام
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                          <Users className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold">المستخدمين المحظورين</span>
                      </div>
                      <span className="text-xl font-black text-red-500">{users.filter(u => u.isBanned).length}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                          <ShieldAlert className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold">المدراء</span>
                      </div>
                      <span className="text-xl font-black text-amber-500">{users.filter(u => u.role === 'admin').length}</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold">منتجات المتجر</span>
                      </div>
                      <span className="text-xl font-black text-rose-500">{storeItems.length}</span>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                      <h4 className="text-xs font-bold text-neutral-500 mb-4 uppercase tracking-widest">إجراءات سريعة للمالك</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setActiveTab('logs')} className="p-3 bg-white/5 rounded-xl text-[10px] font-bold hover:bg-white/10 transition-all flex items-center gap-2 justify-center">
                          <ShieldCheck className="w-3 h-3" />
                          عرض السجلات
                        </button>
                        <button onClick={() => setActiveTab('settings')} className="p-3 bg-white/5 rounded-xl text-[10px] font-bold hover:bg-white/10 transition-all flex items-center gap-2 justify-center">
                          <Settings className="w-3 h-3" />
                          إعدادات النظام
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-8">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-amber-500" />
                    إرسال إعلان سريع
                  </h3>
                  <p className="text-xs text-neutral-500 mb-4">سيظهر هذا الإعلان في شريط الأخبار لجميع المستخدمين المتواجدين حالياً.</p>
                  <div className="space-y-4">
                    <textarea 
                      value={announcement} 
                      onChange={(e) => setAnnouncement(e.target.value)} 
                      placeholder="اكتب إعلاناً..." 
                      className="w-full bg-neutral-900 border border-white/5 rounded-2xl px-6 py-4 focus:outline-none focus:border-amber-500 h-24" 
                    />
                    <button 
                      onClick={handleSendAnnouncement} 
                      disabled={isSendingAnnouncement || !announcement.trim()} 
                      className="w-full bg-amber-500 text-black py-4 rounded-2xl font-black hover:bg-amber-400 transition-all disabled:opacity-50"
                    >
                      إرسال الآن
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="relative max-w-md">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث عن مستخدم..." className="w-full bg-neutral-900 border border-white/5 rounded-2xl pr-12 pl-4 py-3 focus:outline-none focus:border-amber-500" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="text-neutral-500 text-sm border-b border-white/5">
                      <th className="pb-4 font-medium">المستخدم</th>
                      <th className="pb-4 font-medium">البريد الإلكتروني</th>
                      <th className="pb-4 font-medium">الرصيد</th>
                      <th className="pb-4 font-medium">الحالة</th>
                      <th className="pb-4 font-medium">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="group hover:bg-white/5 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <img src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-10 h-10 rounded-full" />
                            <div>
                              <p className="font-bold flex items-center gap-2">
                                {u.username}
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(u.id);
                                    alert("تم نسخ معرف المستخدم");
                                  }} 
                                  className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded hover:bg-white/10 text-neutral-500"
                                  title="نسخ المعرف"
                                >
                                  ID
                                </button>
                              </p>
                              <p className="text-xs text-neutral-500">LVL {u.level}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-neutral-400">{u.email}</td>
                        <td className="py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Coins className="w-4 h-4 text-amber-500" />
                              <span className="text-amber-500 font-bold">{formatNumber(u.coins)}</span>
                              <button onClick={() => handleQuickAdd(u.id, 'coins')} className="p-1 hover:bg-amber-500/10 rounded"><Plus className="w-3 h-3" /></button>
                            </div>
                            <div className="flex items-center gap-2">
                              <Gem className="w-4 h-4 text-blue-400" />
                              <span className="text-blue-400 font-bold">{formatNumber(u.diamonds)}</span>
                              <button onClick={() => handleQuickAdd(u.id, 'diamonds')} className="p-1 hover:bg-blue-500/10 rounded"><Plus className="w-3 h-3" /></button>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={cn("px-2 py-1 text-[10px] font-bold rounded-full", u.isBanned ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500")}>
                            {u.isBanned ? "محظور" : "نشط"}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setSelectedUserForInventory(u);
                                setIsInventoryModalOpen(true);
                              }} 
                              className="p-2 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500/20"
                              title="إدارة الحقيبة"
                            >
                              <ShoppingBag className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleUpdateUserRole(u.id, u.role)} 
                              className={cn("p-2 rounded-xl transition-all", u.role === 'admin' ? "bg-amber-500 text-black" : "bg-neutral-800 text-neutral-400")}
                              title="تغيير الرتبة"
                            >
                              <ShieldCheck className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleBanUser(u.id, u.isBanned)} className="p-2 bg-neutral-800 rounded-xl hover:bg-red-500/20"><Ban className="w-5 h-5" /></button>
                            <button onClick={() => handleDeleteUser(u.id)} className="p-2 bg-red-500/10 text-red-500 rounded-xl"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'rooms' && (
            <motion.div key="rooms" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">إدارة الغرف</h3>
                <button onClick={() => setIsAddingRoom(!isAddingRoom)} className="flex items-center gap-2 bg-amber-500 text-black px-6 py-3 rounded-2xl font-bold hover:bg-amber-400">
                  <Plus className="w-5 h-5" />
                  إنشاء غرفة
                </button>
              </div>

              {isAddingRoom && (
                <div className="bg-neutral-900 border border-amber-500/30 rounded-3xl p-6 space-y-4">
                  <h4 className="font-bold text-amber-500">إنشاء غرفة جديدة</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="اسم الغرفة" value={newRoomForm.name} onChange={e => setNewRoomForm({...newRoomForm, name: e.target.value})} className="bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none" />
                    <input type="text" placeholder="معرف صاحب الغرفة (Owner ID)" value={newRoomForm.ownerId} onChange={e => setNewRoomForm({...newRoomForm, ownerId: e.target.value})} className="bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none" />
                    <input type="text" placeholder="وصف الغرفة" value={newRoomForm.description} onChange={e => setNewRoomForm({...newRoomForm, description: e.target.value})} className="bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none" />
                    <input type="text" placeholder="رابط الغلاف (URL)" value={newRoomForm.coverUrl} onChange={e => setNewRoomForm({...newRoomForm, coverUrl: e.target.value})} className="bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none" />
                    <div className="grid grid-cols-2 gap-4">
                      <select value={newRoomForm.type} onChange={e => setNewRoomForm({...newRoomForm, type: e.target.value as any})} className="bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none">
                        <option value="public">عامة</option>
                        <option value="private">خاصة</option>
                        <option value="vip">VIP</option>
                      </select>
                      <input type="number" placeholder="عدد المقاعد" value={newRoomForm.maxSeats} onChange={e => setNewRoomForm({...newRoomForm, maxSeats: parseInt(e.target.value) || 6})} className="bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setIsAddingRoom(false)} className="px-6 py-2 text-neutral-400 font-bold">إلغاء</button>
                    <button onClick={handleAddRoom} className="bg-amber-500 text-black px-8 py-2 rounded-xl font-bold hover:bg-amber-400">إنشاء</button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map(room => (
                  <div key={room.id} className="bg-neutral-900 border border-white/5 rounded-3xl p-6 flex flex-col gap-4 group hover:border-amber-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img src={room.coverUrl || `https://picsum.photos/seed/${room.id}/100/100`} className="w-20 h-20 rounded-2xl object-cover" />
                        {room.isLive && (
                          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-full animate-pulse">LIVE</div>
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h4 className="font-bold truncate text-lg">{room.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                          <Users className="w-3 h-3" />
                          <span>{room.memberCount} / {room.maxSeats} مقعد</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <GiftIcon className="w-3 h-3" />
                          <span>{formatNumber(room.totalGifts || 0)} هدية</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <span className={cn("px-2 py-1 rounded-lg text-[10px] font-bold", 
                          room.type === 'vip' ? "bg-amber-500/10 text-amber-500" : 
                          room.type === 'private' ? "bg-rose-500/10 text-rose-500" : 
                          "bg-blue-500/10 text-blue-500"
                        )}>
                          {room.type.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleDeleteRoom(room.id)} 
                          className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 transition-all"
                          title="حذف الغرفة"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'gifts' && (
            <motion.div key="gifts" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">إدارة الهدايا</h3>
                <button onClick={() => setIsAddingGift(!isAddingGift)} className="flex items-center gap-2 bg-amber-500 text-black px-6 py-3 rounded-2xl font-bold hover:bg-amber-400">
                  <Plus className="w-5 h-5" />
                  إضافة هدية
                </button>
              </div>

              {isAddingGift && (
                <div className="bg-neutral-900 border border-amber-500/30 rounded-3xl p-6 space-y-4">
                  <h4 className="font-bold text-amber-500">إضافة هدية جديدة</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="اسم الهدية" value={newGiftForm.name} onChange={e => setNewGiftForm({...newGiftForm, name: e.target.value})} className="bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none" />
                    <input type="text" placeholder="رابط الأيقونة (URL)" value={newGiftForm.iconUrl} onChange={e => setNewGiftForm({...newGiftForm, iconUrl: e.target.value})} className="bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none" />
                    <input type="text" placeholder="رابط الأنيميشن (URL - اختياري)" value={newGiftForm.animationUrl} onChange={e => setNewGiftForm({...newGiftForm, animationUrl: e.target.value})} className="bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none" />
                    <input type="number" placeholder="التكلفة (عملات)" value={newGiftForm.cost || ''} onChange={e => setNewGiftForm({...newGiftForm, cost: parseInt(e.target.value) || 0})} className="bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none" />
                    <select value={newGiftForm.category} onChange={e => setNewGiftForm({...newGiftForm, category: e.target.value as any})} className="bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none">
                      <option value="gifts">هدايا عامة</option>
                      <option value="romance">رومانسية</option>
                      <option value="flags">أعلام</option>
                      <option value="special">خاصة</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => setIsAddingGift(false)} className="px-6 py-2 rounded-xl text-neutral-400 hover:bg-white/5">إلغاء</button>
                    <button onClick={handleAddGift} className="px-6 py-2 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400">إضافة</button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {gifts.map(gift => (
                  <div key={gift.id} className="bg-neutral-900 border border-white/5 rounded-3xl p-4 flex flex-col items-center gap-3 group relative">
                    <button 
                      onClick={() => handleDeleteGift(gift.id)} 
                      className="absolute top-2 right-2 p-1.5 bg-red-500/10 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <img src={gift.iconUrl} alt={gift.name} className="w-16 h-16 object-contain" />
                    <div className="text-center">
                      <p className="font-bold text-sm truncate w-full">{gift.name}</p>
                      <div className="flex items-center justify-center gap-1 text-amber-500 text-xs font-black">
                        <Coins className="w-3 h-3" />
                        {formatNumber(gift.cost)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'store' && (
            <motion.div key="store" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">إدارة المتجر</h3>
                <div className="flex gap-2">
                  <button onClick={() => setIsAddingStoreItem(!isAddingStoreItem)} className="flex items-center gap-2 bg-amber-500 text-black px-6 py-3 rounded-2xl font-bold hover:bg-amber-400"><Plus className="w-5 h-5" />إضافة عنصر</button>
                  <button onClick={handleSeedStore} disabled={isSeeding} className="flex items-center gap-2 bg-white/5 px-6 py-3 rounded-2xl font-bold border border-white/5"><RefreshCw className={cn("w-5 h-5", isSeeding && "animate-spin")} />استيراد الافتراضي</button>
                </div>
              </div>

              {isAddingStoreItem && (
                <div className="bg-neutral-900 border border-amber-500/30 rounded-3xl p-6 space-y-4">
                  <h4 className="font-bold text-amber-500">إضافة عنصر جديد</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="اسم العنصر" value={newItemForm.name} onChange={e => setNewItemForm({...newItemForm, name: e.target.value})} className="bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none" />
                    <input type="text" placeholder="رابط الصورة (URL)" value={newItemForm.imageUrl} onChange={e => setNewItemForm({...newItemForm, imageUrl: e.target.value})} className="bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none" />
                    <input type="text" placeholder="الوصف" value={newItemForm.description} onChange={e => setNewItemForm({...newItemForm, description: e.target.value})} className="bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none md:col-span-2" />
                    <div className="flex gap-4">
                      <input type="number" placeholder="السعر" value={newItemForm.price || ''} onChange={e => setNewItemForm({...newItemForm, price: parseInt(e.target.value) || 0})} className="flex-1 bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none" />
                      <select value={newItemForm.currency} onChange={e => setNewItemForm({...newItemForm, currency: e.target.value as any})} className="bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none">
                        <option value="coins">عملات</option>
                        <option value="diamonds">ألماس</option>
                      </select>
                    </div>
                    <select value={newItemForm.category} onChange={e => setNewItemForm({...newItemForm, category: e.target.value as any})} className="bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none">
                      <option value="frame">إطار</option>
                      <option value="entry_effect">تأثير دخول</option>
                      <option value="badge">وسام</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => setIsAddingStoreItem(false)} className="px-6 py-2 rounded-xl text-neutral-400 hover:bg-white/5">إلغاء</button>
                    <button onClick={handleAddStoreItem} className="px-6 py-2 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400">إضافة</button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {storeItems.map(item => (
                  <div key={item.id} className="bg-neutral-900 border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <img src={item.imageUrl} className="w-12 h-12 object-contain" />
                      <div>
                        <h4 className="font-bold">{item.name}</h4>
                        <p className="text-[10px] text-neutral-500">{item.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-black/20 p-4 rounded-2xl">
                      <div className="flex items-center gap-2">
                        {item.currency === 'coins' ? <Coins className="w-4 h-4 text-yellow-500" /> : <Gem className="w-4 h-4 text-blue-400" />}
                        {editingItemId === item.id ? (
                          <input type="number" value={editPrice} onChange={(e) => setEditPrice(parseInt(e.target.value))} className="w-24 bg-neutral-800 border border-amber-500 rounded-lg px-2 py-1" />
                        ) : (
                          <span className="font-black">{formatNumber(item.price)}</span>
                        )}
                      </div>
                      <button onClick={() => editingItemId === item.id ? handleUpdatePrice(item.id) : (setEditingItemId(item.id), setEditPrice(item.price))} className="p-2 bg-white/5 rounded-xl">{editingItemId === item.id ? <Save className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}</button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'tasks' && (
            <motion.div key="tasks" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">المهام اليومية</h3>
                  <p className="text-xs text-neutral-500">إدارة المهام المتاحة لجميع المستخدمين</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setIsAddingTask(!isAddingTask)} className="flex items-center gap-2 bg-amber-500 text-black px-6 py-3 rounded-2xl font-bold hover:bg-amber-400">
                    <Plus className="w-5 h-5" />
                    إضافة مهمة
                  </button>
                  <button onClick={handleSeedTasks} className="flex items-center gap-2 bg-white/5 px-6 py-3 rounded-2xl font-bold border border-white/5">
                    <RefreshCw className="w-5 h-5" />
                    استيراد الافتراضي
                  </button>
                </div>
              </div>

              {isAddingTask && (
                <div className="bg-neutral-900 border border-amber-500/30 rounded-3xl p-6 space-y-4">
                  <h4 className="font-bold text-amber-500">إضافة مهمة جديدة</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="عنوان المهمة" value={newTaskForm.title} onChange={e => setNewTaskForm({...newTaskForm, title: e.target.value})} className="bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none" />
                    <input type="text" placeholder="وصف المهمة" value={newTaskForm.description} onChange={e => setNewTaskForm({...newTaskForm, description: e.target.value})} className="bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none" />
                    <input type="number" placeholder="الهدف (مثلاً: 20)" value={newTaskForm.target || ''} onChange={e => setNewTaskForm({...newTaskForm, target: parseInt(e.target.value) || 0})} className="bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none" />
                    <select value={newTaskForm.type} onChange={e => setNewTaskForm({...newTaskForm, type: e.target.value as any})} className="bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none">
                      <option value="chat">دردشة</option>
                      <option value="gift">هدايا</option>
                      <option value="time">وقت</option>
                      <option value="mic">مايك</option>
                      <option value="game">ألعاب</option>
                    </select>
                    <select value={newTaskForm.frequency} onChange={e => setNewTaskForm({...newTaskForm, frequency: e.target.value as any})} className="bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none">
                      <option value="daily">يومية</option>
                      <option value="weekly">أسبوعية</option>
                    </select>
                    <input type="number" placeholder="مكافأة العملات" value={newTaskForm.rewardCoins || ''} onChange={e => setNewTaskForm({...newTaskForm, rewardCoins: parseInt(e.target.value) || 0})} className="bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none" />
                    <input type="number" placeholder="مكافأة XP" value={newTaskForm.rewardXp || ''} onChange={e => setNewTaskForm({...newTaskForm, rewardXp: parseInt(e.target.value) || 0})} className="bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none" />
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => setIsAddingTask(false)} className="px-6 py-2 rounded-xl text-neutral-400 hover:bg-white/5">إلغاء</button>
                    <button onClick={handleAddTask} className="px-6 py-2 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400">إضافة</button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tasks.length > 0 ? tasks.map(task => (
                  <div key={task.id} className="bg-neutral-900 border border-white/5 rounded-3xl p-6 space-y-4 group relative">
                    <button 
                      onClick={() => handleDeleteTask(task.id)} 
                      className="absolute top-4 left-4 p-2 bg-red-500/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold">{task.title}</h4>
                            <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full font-bold", task.frequency === 'weekly' ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400")}>
                              {task.frequency === 'weekly' ? 'أسبوعية' : 'يومية'}
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-500">{task.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                      <div className="text-center">
                        <p className="text-[10px] text-neutral-500 mb-1">الهدف</p>
                        <p className="font-bold">{task.target}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-neutral-500 mb-1">العملات</p>
                        <p className="font-bold text-amber-500">{task.rewardCoins}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-neutral-500 mb-1">XP</p>
                        <p className="font-bold text-blue-400">{task.rewardXp}</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="md:col-span-2 text-center py-12 bg-neutral-900/50 rounded-[40px] border border-dashed border-white/10">
                    <Trophy className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                    <p className="text-neutral-500">لا توجد مهام نشطة حالياً. قم بإضافة مهمة أو استيراد المهام الافتراضية.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'rewards' && (
            <motion.div key="rewards" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">قواعد المكافآت</h3>
                  <p className="text-xs text-neutral-500">إدارة قواعد الاسترداد (Cashback) ومكافآت الإنجاز</p>
                </div>
                <button onClick={() => setIsAddingRewardRule(!isAddingRewardRule)} className="flex items-center gap-2 bg-amber-500 text-black px-6 py-3 rounded-2xl font-bold hover:bg-amber-400">
                  <Plus className="w-5 h-5" />
                  إضافة قاعدة
                </button>
              </div>

              {isAddingRewardRule && (
                <div className="bg-neutral-900 border border-amber-500/30 rounded-3xl p-6 space-y-4">
                  <h4 className="font-bold text-amber-500">إضافة قاعدة مكافأة جديدة</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="اسم القاعدة" value={newRewardRuleForm.name} onChange={e => setNewRewardRuleForm({...newRewardRuleForm, name: e.target.value})} className="bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none" />
                    <select value={newRewardRuleForm.type} onChange={e => setNewRewardRuleForm({...newRewardRuleForm, type: e.target.value as any})} className="bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none">
                      <option value="spending_cashback">استرداد نقدي (Cashback)</option>
                      <option value="gift_milestone">إنجاز الهدايا</option>
                    </select>
                    <input type="number" placeholder="قيمة التفعيل (مثلاً: إنفاق 1000)" value={newRewardRuleForm.triggerValue || ''} onChange={e => setNewRewardRuleForm({...newRewardRuleForm, triggerValue: parseInt(e.target.value) || 0})} className="bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none" />
                    <input type="number" placeholder="قيمة المكافأة" value={newRewardRuleForm.rewardValue || ''} onChange={e => setNewRewardRuleForm({...newRewardRuleForm, rewardValue: parseInt(e.target.value) || 0})} className="bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none" />
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => setIsAddingRewardRule(false)} className="px-6 py-2 rounded-xl text-neutral-400 hover:bg-white/5">إلغاء</button>
                    <button onClick={handleAddRewardRule} className="px-6 py-2 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400">إضافة</button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rewardRules.map(rule => (
                  <div key={rule.id} className="bg-neutral-900 border border-white/5 rounded-3xl p-6 space-y-4 group relative">
                    <button onClick={() => handleDeleteRewardRule(rule.id)} className="absolute top-4 left-4 p-2 bg-red-500/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                        <Star className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="font-bold">{rule.name}</h4>
                        <p className="text-[10px] text-neutral-500">{rule.type === 'spending_cashback' ? 'استرداد عند الإنفاق' : 'مكافأة عند إرسال الهدايا'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                      <div className="text-center">
                        <p className="text-[10px] text-neutral-500 mb-1">قيمة التفعيل</p>
                        <p className="font-bold">{rule.trigger_value}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-neutral-500 mb-1">المكافأة</p>
                        <p className="font-bold text-amber-500">{rule.reward_value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'events' && (
            <motion.div key="events" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">إدارة الفعاليات</h3>
                <button onClick={() => setIsAddingEvent(!isAddingEvent)} className="flex items-center gap-2 bg-amber-500 text-black px-6 py-3 rounded-2xl font-bold hover:bg-amber-400">
                  <Plus className="w-5 h-5" />
                  إضافة فعالية
                </button>
              </div>

              {isAddingEvent && (
                <div className="bg-neutral-900 border border-amber-500/30 rounded-3xl p-6 space-y-6">
                  <h4 className="font-bold text-amber-500">إنشاء فعالية جديدة</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-neutral-500 px-2">عنوان الفعالية</label>
                      <input type="text" placeholder="مثلاً: مهرجان الربيع" value={newEventForm.title} onChange={e => setNewEventForm({...newEventForm, title: e.target.value})} className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-neutral-500 px-2">رابط صورة البانر</label>
                      <input type="text" placeholder="URL الصورة" value={newEventForm.bannerUrl} onChange={e => setNewEventForm({...newEventForm, bannerUrl: e.target.value})} className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs text-neutral-500 px-2">وصف الفعالية</label>
                      <textarea placeholder="تحدث عن الفعالية..." value={newEventForm.description} onChange={e => setNewEventForm({...newEventForm, description: e.target.value})} className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none h-24" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-neutral-500 px-2">تاريخ البدء</label>
                      <input type="date" value={newEventForm.startAt} onChange={e => setNewEventForm({...newEventForm, startAt: e.target.value})} className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-neutral-500 px-2">تاريخ الانتهاء</label>
                      <input type="date" value={newEventForm.endAt} onChange={e => setNewEventForm({...newEventForm, endAt: e.target.value})} className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-sm">مهام الفعالية</h5>
                      <button onClick={handleAddTaskToEvent} className="text-xs text-amber-500 hover:underline flex items-center gap-1">
                        <Plus className="w-3 h-3" />
                        إضافة مهمة
                      </button>
                    </div>
                    <div className="space-y-3">
                      {newEventForm.tasks?.map((task, index) => (
                        <div key={index} className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-neutral-500">مهمة #{index + 1}</span>
                            <button onClick={() => handleRemoveEventTask(index)} className="text-red-500 hover:text-red-400">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            <input type="text" placeholder="عنوان المهمة" value={task.title} onChange={e => handleUpdateEventTask(index, 'title', e.target.value)} className="bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-500" />
                            <input type="text" placeholder="وصف المهمة" value={task.description} onChange={e => handleUpdateEventTask(index, 'description', e.target.value)} className="bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-500" />
                            <select value={task.type} onChange={e => handleUpdateEventTask(index, 'type', e.target.value)} className="bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-500">
                              <option value="chat">دردشة</option>
                              <option value="gift">هدايا</option>
                              <option value="time">وقت</option>
                              <option value="mic">مايك</option>
                            </select>
                            <div className="flex items-center gap-2">
                              <label className="text-[10px] text-neutral-500">الهدف:</label>
                              <input type="number" value={task.target} onChange={e => handleUpdateEventTask(index, 'target', parseInt(e.target.value) || 0)} className="flex-1 bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-500" />
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-[10px] text-neutral-500">العملات:</label>
                              <input type="number" value={task.rewardCoins} onChange={e => handleUpdateEventTask(index, 'rewardCoins', parseInt(e.target.value) || 0)} className="flex-1 bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-500" />
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-[10px] text-neutral-500">XP:</label>
                              <input type="number" value={task.rewardXp} onChange={e => handleUpdateEventTask(index, 'rewardXp', parseInt(e.target.value) || 0)} className="flex-1 bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-500" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                    <button onClick={() => setIsAddingEvent(false)} className="px-6 py-2 rounded-xl text-neutral-400 hover:bg-white/5">إلغاء</button>
                    <button onClick={handleAddEvent} className="px-8 py-2 rounded-xl bg-amber-500 text-black font-black hover:bg-amber-400">حفظ الفعالية</button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map(event => (
                  <div key={event.id} className="bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden flex flex-col">
                    <div className="relative h-32">
                      <img src={event.bannerUrl || "https://picsum.photos/seed/event/800/400"} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xl font-black text-white">{event.title}</h4>
                          <span className={cn("px-2 py-1 rounded-full text-[10px] font-bold", event.isActive ? "bg-green-500 text-black" : "bg-red-500 text-white")}>
                            {event.isActive ? "نشطة" : "متوقفة"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <p className="text-xs text-neutral-400 line-clamp-2">{event.description}</p>
                      <div className="flex items-center justify-between text-[10px] text-neutral-500">
                        <span>تبدأ: {new Date(event.startAt).toLocaleDateString('ar-EG')}</span>
                        <span>تنتهي: {new Date(event.endAt).toLocaleDateString('ar-EG')}</span>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <span className="text-xs font-bold text-amber-500">{event.tasks.length} مهام</span>
                        <div className="flex gap-2">
                          <button onClick={() => handleToggleEvent(event.id, event.isActive)} className="p-2 bg-white/5 rounded-xl hover:bg-white/10">
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteEvent(event.id)} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          {activeTab === 'logs' && (
            <motion.div key="logs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">سجلات الإدارة</h3>
                <button onClick={() => setLogs([])} className="text-xs text-neutral-500 hover:text-white">مسح السجلات (عرض فقط)</button>
              </div>
              <div className="bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden">
                <table className="w-full text-right">
                  <thead>
                    <tr className="text-neutral-500 text-sm border-b border-white/5 bg-white/5">
                      <th className="p-4 font-medium">المسؤول</th>
                      <th className="p-4 font-medium">الإجراء</th>
                      <th className="p-4 font-medium">التفاصيل</th>
                      <th className="p-4 font-medium">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-10 text-center text-neutral-500 italic">لا توجد سجلات حالياً</td>
                      </tr>
                    ) : (
                      logs.map(log => (
                        <tr key={log.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-bold text-sm">{log.admin_name || "نظام"}</td>
                          <td className="p-4">
                            <span className={cn("px-2 py-1 rounded-lg text-[10px] font-bold", 
                              log.action === 'ban' ? "bg-red-500/10 text-red-500" : 
                              log.action === 'role_change' ? "bg-amber-500/10 text-amber-500" : 
                              "bg-blue-500/10 text-blue-500"
                            )}>
                              {log.action.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-neutral-400">{log.details}</td>
                          <td className="p-4 text-[10px] text-neutral-500">{new Date(log.created_at).toLocaleString('ar-EG')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-8">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-amber-500" />
                  إعدادات المنصة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-neutral-400">إعلان النظام (شريط متحرك)</label>
                    <textarea 
                      value={announcement} 
                      onChange={(e) => setAnnouncement(e.target.value)} 
                      placeholder="اكتب إعلاناً يظهر لجميع المستخدمين..." 
                      className="w-full bg-neutral-900 border border-white/5 rounded-2xl px-6 py-4 focus:outline-none focus:border-amber-500 h-32" 
                    />
                    <button 
                      onClick={handleSendAnnouncement} 
                      disabled={isSendingAnnouncement || !announcement.trim()} 
                      className="w-full bg-amber-500 text-black py-4 rounded-2xl font-black hover:bg-amber-400 transition-all disabled:opacity-50"
                    >
                      تحديث الإعلان
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                      <h4 className="font-bold mb-4">أدوات الصيانة</h4>
                      <div className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-xl">
                        <span>وضع الصيانة</span>
                        <div className="w-12 h-6 bg-neutral-700 rounded-full relative cursor-pointer opacity-50">
                          <div className="absolute left-1 top-1 w-4 h-4 bg-neutral-500 rounded-full" />
                        </div>
                      </div>
                      <p className="text-[10px] text-neutral-500 mt-2">سيتم منع جميع المستخدمين من الدخول عدا المدراء.</p>
                    </div>

                    <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                      <h4 className="font-bold mb-4">قاعدة البيانات</h4>
                      <button 
                        onClick={handleSeedStore} 
                        disabled={isSeeding} 
                        className="w-full flex items-center justify-center gap-2 bg-white/5 py-3 rounded-xl font-bold border border-white/5 hover:bg-white/10 transition-all"
                      >
                        <RefreshCw className={cn("w-4 h-4", isSeeding && "animate-spin")} />
                        إعادة ضبط المتجر الافتراضي
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      {/* Inventory Management Modal */}
      <AnimatePresence>
        {isInventoryModalOpen && selectedUserForInventory && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="bg-neutral-900 border border-white/10 rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src={selectedUserForInventory.avatarUrl} className="w-12 h-12 rounded-full" />
                  <div>
                    <h3 className="text-xl font-bold">إدارة حقيبة {selectedUserForInventory.username}</h3>
                    <p className="text-xs text-neutral-500">إضافة أو حذف عناصر من حقيبة المستخدم</p>
                  </div>
                </div>
                <button onClick={() => setIsInventoryModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 h-[500px] overflow-y-auto">
                <div className="space-y-4">
                  <h4 className="font-bold text-amber-500 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    العناصر المملوكة
                  </h4>
                  <div className="space-y-2">
                    {selectedUserForInventory.inventory.length === 0 ? (
                      <p className="text-xs text-neutral-500 italic">الحقيبة فارغة</p>
                    ) : (
                      selectedUserForInventory.inventory.map(invItem => {
                        const item = storeItems.find(si => si.id === invItem.itemId);
                        return (
                          <div key={invItem.itemId} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-3">
                              <img src={item?.imageUrl} className="w-8 h-8 object-contain" />
                              <span className="text-sm font-bold">{item?.name || "عنصر غير معروف"}</span>
                            </div>
                            <button 
                              onClick={() => handleRemoveFromInventory(selectedUserForInventory.id, invItem.itemId)} 
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-blue-400 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    إضافة عناصر جديدة
                  </h4>
                  <div className="space-y-2">
                    {storeItems
                      .filter(si => !selectedUserForInventory.inventory.some(inv => inv.itemId === si.id))
                      .map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <img src={item.imageUrl} className="w-8 h-8 object-contain" />
                            <span className="text-sm font-bold">{item.name}</span>
                          </div>
                          <button 
                            onClick={() => handleAddToInventory(selectedUserForInventory.id, item.id)} 
                            className="p-2 text-green-500 hover:bg-green-500/10 rounded-xl"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function SidebarItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button onClick={onClick} className={cn("flex items-center gap-4 p-4 rounded-2xl transition-all font-bold text-sm", active ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "text-neutral-400 hover:bg-white/5 hover:text-white")}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: 'blue' | 'amber' | 'rose' }) {
  const colors = {
    blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    rose: "bg-rose-500/10 text-rose-500 border-rose-500/20"
  };
  return (
    <div className={cn("p-6 rounded-3xl border flex items-center gap-6", colors[color])}>
      <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">{icon}</div>
      <div>
        <p className="text-neutral-400 text-xs mb-1">{label}</p>
        <p className="text-2xl font-black text-white">{formatNumber(value)}</p>
      </div>
    </div>
  );
}
