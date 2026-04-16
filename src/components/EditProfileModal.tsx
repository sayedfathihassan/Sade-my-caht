import React, { useState, useRef, useEffect } from "react";
import { User, StoreItem } from "@/src/types";
import { supabase } from "@/src/lib/supabase";
import { motion, AnimatePresence } from "motion/react";
import { X, Save, User as UserIcon, Calendar, Users, Camera, MessageSquare, Layout, Sparkles, ShieldCheck } from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { storeService } from "@/src/services/storeService";
import { cn } from "@/src/lib/utils";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export function EditProfileModal({ isOpen, onClose, user }: EditProfileModalProps) {
  const [username, setUsername] = useState(user.username);
  const [birthDate, setBirthDate] = useState(user.birthDate || "");
  const [gender, setGender] = useState<User['gender']>(user.gender || 'male');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [loading, setLoading] = useState(false);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [activeFrameId, setActiveFrameId] = useState(user.activeFrameId);
  const [activeChatBubbleId, setActiveChatBubbleId] = useState(user.activeChatBubbleId);
  const [activeBadgeId, setActiveBadgeId] = useState(user.activeBadgeId);
  const [activeEntryEffectId, setActiveEntryEffectId] = useState(user.activeEntryEffectId);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    storeService.getItems().then(setStoreItems);
  }, [isOpen]);

  const ownedItemIds = user.inventory?.map(i => i.itemId) || [];
  const myFrames = storeItems.filter(i => i.category === 'frame' && ownedItemIds.includes(i.id));
  const myBubbles = storeItems.filter(i => i.category === 'chat_bubble' && ownedItemIds.includes(i.id));
  const myBadges = storeItems.filter(i => i.category === 'badge' && ownedItemIds.includes(i.id));
  const myEffects = storeItems.filter(i => i.category === 'entry_effect' && ownedItemIds.includes(i.id));

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setAvatarUrl(data.publicUrl);
    } catch (error) {
      console.error("Failed to upload avatar", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!username.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          username: username.trim(),
          birth_date: birthDate,
          gender,
          avatar_url: avatarUrl,
          active_frame_id: activeFrameId,
          active_chat_bubble_id: activeChatBubbleId,
          active_badge_id: activeBadgeId,
          active_entry_effect_id: activeEntryEffectId
        })
        .eq('id', user.id);
      
      if (error) throw error;
      onClose();
    } catch (error) {
      console.error("Failed to update profile", error);
    } finally {
      setLoading(false);
    }
  };

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
            className="relative w-full max-w-md bg-neutral-900 rounded-[32px] border border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold">تعديل الملف الشخصي</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
              {/* Avatar Upload */}
              <div className="flex justify-center">
                <div className="relative">
                  <UserAvatar username={username} src={avatarUrl} size="xl" frameUrl={activeFrameId} />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-amber-500 rounded-full hover:bg-amber-400 transition-all z-20"
                  >
                    <Camera className="w-4 h-4 text-black" />
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <label className="text-xs text-neutral-500 font-bold flex items-center gap-2">
                  <UserIcon className="w-3 h-3" />
                  اسم المستخدم
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50 transition-all"
                  placeholder="أدخل اسمك الجديد"
                />
              </div>

              {/* Equipped Items Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  تخصيص المظهر
                </h3>

                {/* Chat Bubble Selection */}
                <div className="space-y-2">
                  <label className="text-xs text-neutral-500 font-bold flex items-center gap-2">
                    <MessageSquare className="w-3 h-3" />
                    فقاعة الدردشة
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                    <button
                      onClick={() => setActiveChatBubbleId(undefined)}
                      className={cn(
                        "shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center transition-all",
                        !activeChatBubbleId ? "border-amber-500 bg-amber-500/10" : "border-white/5 bg-black/40"
                      )}
                    >
                      <X className="w-4 h-4 text-neutral-500" />
                    </button>
                    {myBubbles.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveChatBubbleId(item.id)}
                        className={cn(
                          "shrink-0 w-12 h-12 rounded-xl border p-1 transition-all overflow-hidden",
                          activeChatBubbleId === item.id ? "border-amber-500 bg-amber-500/10" : "border-white/5 bg-black/40"
                        )}
                        title={item.name}
                      >
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Frame Selection */}
                <div className="space-y-2">
                  <label className="text-xs text-neutral-500 font-bold flex items-center gap-2">
                    <Layout className="w-3 h-3" />
                    الإطار النشط
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                    <button
                      onClick={() => setActiveFrameId(undefined)}
                      className={cn(
                        "shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center transition-all",
                        !activeFrameId ? "border-amber-500 bg-amber-500/10" : "border-white/5 bg-black/40"
                      )}
                    >
                      <X className="w-4 h-4 text-neutral-500" />
                    </button>
                    {myFrames.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveFrameId(item.id)}
                        className={cn(
                          "shrink-0 w-12 h-12 rounded-xl border p-1 transition-all overflow-hidden",
                          activeFrameId === item.id ? "border-amber-500 bg-amber-500/10" : "border-white/5 bg-black/40"
                        )}
                        title={item.name}
                      >
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Badge Selection */}
                <div className="space-y-2">
                  <label className="text-xs text-neutral-500 font-bold flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" />
                    الوسام النشط
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                    <button
                      onClick={() => setActiveBadgeId(undefined)}
                      className={cn(
                        "shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center transition-all",
                        !activeBadgeId ? "border-amber-500 bg-amber-500/10" : "border-white/5 bg-black/40"
                      )}
                    >
                      <X className="w-4 h-4 text-neutral-500" />
                    </button>
                    {myBadges.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveBadgeId(item.id)}
                        className={cn(
                          "shrink-0 w-12 h-12 rounded-xl border p-1 transition-all overflow-hidden",
                          activeBadgeId === item.id ? "border-amber-500 bg-amber-500/10" : "border-white/5 bg-black/40"
                        )}
                        title={item.name}
                      >
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Birth Date */}
              <div className="space-y-2">
                <label className="text-xs text-neutral-500 font-bold flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  تاريخ الميلاد
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50 transition-all text-white"
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className="text-xs text-neutral-500 font-bold flex items-center gap-2">
                  <Users className="w-3 h-3" />
                  النوع
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['male', 'female', 'other'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`py-3 rounded-2xl text-xs font-bold border transition-all ${
                        gender === g 
                          ? 'bg-amber-500 text-black border-transparent' 
                          : 'bg-black/40 text-neutral-500 border-white/5 hover:border-white/10'
                      }`}
                    >
                      {g === 'male' ? 'ذكر' : g === 'female' ? 'أنثى' : 'آخر'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 shrink-0">
                <button
                  onClick={handleSave}
                  disabled={loading || !username.trim()}
                  className="w-full bg-amber-500 text-black font-bold py-4 rounded-2xl hover:bg-amber-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>حفظ التغييرات</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
