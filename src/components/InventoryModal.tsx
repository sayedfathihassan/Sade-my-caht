import { useState, useEffect } from "react";
import { User, StoreItem, StoreItemCategory } from "@/src/types";
import { storeService } from "@/src/services/storeService";
import { motion, AnimatePresence } from "motion/react";
import { X, Box, Layout, Sparkles, ShieldCheck, Check, Power, MessageSquare } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { FrameRenderer } from "./FrameRenderer";
import { ChatBubbleRenderer } from "./ChatBubbleRenderer";

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export function InventoryModal({ isOpen, onClose, user }: InventoryModalProps) {
  const [activeCategory, setActiveCategory] = useState<StoreItemCategory>('frame');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = storeService.subscribeToItems(setStoreItems);
    return () => unsub();
  }, [isOpen]);

  const categories = [
    { id: 'frame', name: 'إطاراتي', icon: Layout },
    { id: 'chat_bubble', name: 'فقاعاتي', icon: MessageSquare },
    { id: 'entry_effect', name: 'تأثيراتي', icon: Sparkles },
    { id: 'badge', name: 'أوسمتي', icon: ShieldCheck },
  ];

  // Only show items that the user owns
  const ownedItemIds = user.inventory?.map(i => i.itemId) || [];
  const myItems = storeItems.filter(item => 
    item.category === activeCategory && ownedItemIds.includes(item.id)
  );

  const handleEquip = async (item: StoreItem) => {
    setLoadingId(item.id);
    try {
      const equipped = isEquipped(item.id);

      if (equipped) {
        await storeService.unequipItem(user.id, activeCategory as any);
      } else {
        await storeService.equipItem(user.id, item.id, activeCategory as any);
      }
    } catch (error) {
      console.error("Failed to equip item", error);
    } finally {
      setLoadingId(null);
    }
  };

  const isEquipped = (itemId: string) => {
    return user.activeFrameId === itemId || 
           user.activeEntryEffectId === itemId || 
           user.activeChatBubbleId === itemId || 
           user.activeBadgeId === itemId;
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
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-neutral-950 rounded-[40px] border border-white/10 overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 md:p-8 border-b border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between bg-gradient-to-r from-blue-500/10 to-transparent gap-4 md:gap-0">
              <div className="flex items-center justify-between w-full md:w-auto">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Box className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-white">حقيبتي</h2>
                    <p className="text-[10px] md:text-xs text-neutral-500 font-bold">إدارة مقتنياتك الخاصة</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors md:hidden">
                  <X className="w-6 h-6 text-neutral-500" />
                </button>
              </div>
              
              <button onClick={onClose} className="hidden md:block p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-6 h-6 text-neutral-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex flex-col md:flex-row h-[60vh] md:h-[500px]">
              {/* Sidebar */}
              <div className="w-full md:w-48 border-b md:border-b-0 md:border-l border-white/5 p-2 md:p-4 flex md:flex-col gap-2 overflow-x-auto bg-black/20 shrink-0 hide-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id as StoreItemCategory)}
                    className={cn(
                      "shrink-0 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold transition-all",
                      activeCategory === cat.id 
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" 
                        : "text-neutral-500 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <cat.icon className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="whitespace-nowrap">{cat.name}</span>
                  </button>
                ))}
              </div>

              {/* Items Grid */}
              <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  {myItems.map((item) => (
                    <motion.div
                      layout
                      key={item.id}
                      className={cn(
                        "bg-white/5 rounded-3xl p-5 border transition-all group relative overflow-hidden",
                        isEquipped(item.id) ? "border-blue-500/50 bg-blue-500/5" : "border-white/5 hover:border-white/10"
                      )}
                    >
                      <div className="relative">
                        {item.category === 'frame' ? (
                          <div className="w-20 h-20 mx-auto mb-4 relative flex items-center justify-center group-hover:scale-110 transition-transform">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-neutral-800">
                              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.id}`} alt="avatar" className="w-full h-full object-cover opacity-50" />
                            </div>
                            <FrameRenderer frameId={item.id} />
                          </div>
                        ) : item.category === 'chat_bubble' ? (
                          <div className="w-32 h-20 mx-auto mb-4 relative flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ChatBubbleRenderer bubbleId={item.id}>
                              <div className="text-center">
                                <span className="text-[10px] font-bold text-amber-500 block mb-1">اسمك</span>
                                <p className="text-xs">مرحباً بالجميع!</p>
                              </div>
                            </ChatBubbleRenderer>
                          </div>
                        ) : (
                          <div className="w-20 h-20 mx-auto mb-4 bg-black/40 rounded-2xl p-3 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                          </div>
                        )}
                        
                        <h3 className="text-sm font-black text-white text-center mb-1">{item.name}</h3>
                        
                        <button
                          onClick={() => handleEquip(item)}
                          disabled={loadingId === item.id}
                          className={cn(
                            "w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black transition-all",
                            isEquipped(item.id)
                              ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                              : "bg-blue-500 text-white hover:bg-blue-400"
                          )}
                        >
                          {loadingId === item.id ? (
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : isEquipped(item.id) ? (
                            <>
                              <Power className="w-3 h-3" />
                              <span>إلغاء التفعيل</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3" />
                              <span>تفعيل الآن</span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {myItems.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-600">
                    <Box className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-bold">لا تملك أي مقتنيات هنا</p>
                    <p className="text-[10px] mt-1">تفضل بزيارة المتجر للحصول على إضافات مميزة!</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
