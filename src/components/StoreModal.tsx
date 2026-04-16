import { useState, useEffect } from "react";
import { User, StoreItem, StoreItemCategory } from "@/src/types";
import { storeService } from "@/src/services/storeService";
import { motion, AnimatePresence } from "motion/react";
import { X, ShoppingBag, Sparkles, Layout, ShieldCheck, Coins, Gem, CheckCircle2, MessageSquare } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { FrameRenderer } from "./FrameRenderer";
import { ChatBubbleRenderer } from "./ChatBubbleRenderer";

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export function StoreModal({ isOpen, onClose, user }: StoreModalProps) {
  const [activeCategory, setActiveCategory] = useState<StoreItemCategory>('frame');
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = storeService.subscribeToItems(setStoreItems);
    return () => unsub();
  }, [isOpen]);

  const categories = [
    { id: 'frame', name: 'إطارات', icon: Layout },
    { id: 'chat_bubble', name: 'فقاعات الغرفة', icon: MessageSquare },
    { id: 'entry_effect', name: 'تأثيرات دخول', icon: Sparkles },
    { id: 'badge', name: 'أوسمة', icon: ShieldCheck },
  ];

  const filteredItems = storeItems.filter(item => item.category === activeCategory);

  const handlePurchase = async (item: StoreItem) => {
    setPurchasingId(item.id);
    setError(null);
    try {
      await storeService.purchaseItem(user, item);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPurchasingId(null);
    }
  };

  const isOwned = (itemId: string) => {
    return user.inventory?.some(i => i.itemId === itemId);
  };

  const isEquipped = (itemId: string) => {
    return user.activeFrameId === itemId || 
           user.activeEntryEffectId === itemId || 
           user.activeChatBubbleId === itemId || 
           user.activeBadgeId === itemId;
  };

  const handleEquip = async (item: StoreItem) => {
    setPurchasingId(item.id);
    try {
      const equipped = isEquipped(item.id);
      if (equipped) {
        await storeService.unequipItem(user.id, item.category as any);
      } else {
        await storeService.equipItem(user.id, item.id, item.category as any);
      }
    } catch (error) {
      console.error("Failed to equip/unequip item", error);
    } finally {
      setPurchasingId(null);
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
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-neutral-950 rounded-[40px] border border-white/10 overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 md:p-8 border-b border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between bg-gradient-to-r from-amber-500/10 to-transparent gap-4 md:gap-0">
              <div className="flex items-center justify-between w-full md:w-auto">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-black" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-white">متجر التميز</h2>
                    <p className="text-[10px] md:text-xs text-neutral-500 font-bold">خصص حضورك واجذب الأنظار</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors md:hidden">
                  <X className="w-6 h-6 text-neutral-500" />
                </button>
              </div>
              
              <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
                <div className="bg-black/40 px-3 md:px-4 py-1.5 md:py-2 rounded-2xl border border-white/5 flex items-center gap-2 shrink-0">
                  <Coins className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-500" />
                  <span className="text-xs md:text-sm font-black text-white">{user.coins}</span>
                </div>
                <div className="bg-black/40 px-3 md:px-4 py-1.5 md:py-2 rounded-2xl border border-white/5 flex items-center gap-2 shrink-0">
                  <Gem className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400" />
                  <span className="text-xs md:text-sm font-black text-white">{user.diamonds}</span>
                </div>
                <button onClick={onClose} className="hidden md:block p-2 hover:bg-white/5 rounded-full transition-colors mr-2 shrink-0">
                  <X className="w-6 h-6 text-neutral-500" />
                </button>
              </div>
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
                        ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" 
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
                {error && (
                  <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-xs font-bold text-center">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  {filteredItems.map((item) => (
                    <motion.div
                      layout
                      key={item.id}
                      className="bg-white/5 rounded-3xl p-5 border border-white/5 hover:border-amber-500/30 transition-all group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-amber-500/10 transition-colors" />
                      
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
                        ) : item.category === 'entry_effect' ? (
                          <div className="w-24 h-24 mx-auto mb-4 bg-black/40 rounded-2xl p-2 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain drop-shadow-xl" />
                          </div>
                        ) : item.category === 'badge' ? (
                          <div className="w-16 h-16 mx-auto mb-4 bg-black/40 rounded-full p-3 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-20 h-20 mx-auto mb-4 bg-black/40 rounded-2xl p-3 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                          </div>
                        )}
                        
                        <h3 className="text-sm font-black text-white text-center mb-1">{item.name}</h3>
                        <p className="text-[10px] text-neutral-500 text-center mb-4 line-clamp-1">{item.description}</p>
                        
                        <div className="flex items-center justify-between gap-2 mt-auto">
                          <div className="flex items-center gap-1.5">
                            {item.currency === 'coins' ? (
                              <Coins className="w-3.5 h-3.5 text-yellow-500" />
                            ) : (
                              <Gem className="w-3.5 h-3.5 text-blue-400" />
                            )}
                            <span className="text-xs font-black text-white">{item.price}</span>
                          </div>
                          
                          {isOwned(item.id) ? (
                            <button
                              onClick={() => handleEquip(item)}
                              disabled={purchasingId === item.id}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all",
                                isEquipped(item.id)
                                  ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                                  : "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                              )}
                            >
                              {isEquipped(item.id) ? 'إلغاء التفعيل' : 'تفعيل'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePurchase(item)}
                              disabled={purchasingId === item.id}
                              className="bg-amber-500 text-black text-[10px] font-black px-4 py-2 rounded-xl hover:bg-amber-400 transition-all disabled:opacity-50"
                            >
                              {purchasingId === item.id ? 'جاري...' : 'شراء'}
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {filteredItems.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-600">
                    <ShoppingBag className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-bold">قريباً في المتجر</p>
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
