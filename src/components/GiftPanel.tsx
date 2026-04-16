import { Gift, User } from "@/src/types";
import { motion, AnimatePresence } from "motion/react";
import { X, Gift as GiftIcon, Box, Users } from "lucide-react";
import { formatNumber } from "@/src/lib/utils";
import { useState } from "react";

const GIFTS_CATALOG: Gift[] = [
  { id: "g1", name: "وردة", iconUrl: "🌹", animationUrl: "", category: "gifts", cost: 5, isActive: true },
  { id: "g2", name: "قهوة", iconUrl: "☕", animationUrl: "", category: "gifts", cost: 20, isActive: true },
  { id: "g3", name: "قلب", iconUrl: "❤️", animationUrl: "", category: "gifts", cost: 50, isActive: true },
  { id: "g4", name: "سيارة", iconUrl: "🚗", animationUrl: "", category: "special", cost: 1000, isActive: true },
  { id: "g5", name: "قصر", iconUrl: "🏰", animationUrl: "", category: "special", cost: 5000, isActive: true },
  { id: "g6", name: "خاتم", iconUrl: "💍", animationUrl: "", category: "romance", cost: 777, isActive: true },
];

interface GiftPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (gift: Gift, recipientId?: string, recipientName?: string) => void;
  onDropLuckyBox: (amount: number, winners: number) => void;
  userCoins: number;
  roomUsers: { id: string, username: string, avatarUrl?: string }[];
  initialRecipientId?: string;
  initialRecipientName?: string;
}

export function GiftPanel({ 
  isOpen, 
  onClose, 
  onSend, 
  onDropLuckyBox,
  userCoins, 
  roomUsers,
  initialRecipientId, 
  initialRecipientName 
}: GiftPanelProps) {
  const [selectedRecipient, setSelectedRecipient] = useState<{ id: string, name: string } | null>(
    initialRecipientId ? { id: initialRecipientId, name: initialRecipientName || "" } : null
  );
  const [activeTab, setActiveTab] = useState<'gifts' | 'lucky'>('gifts');
  const [luckyAmount, setLuckyAmount] = useState(1000);
  const [luckyWinners, setLuckyWinners] = useState(10);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="fixed bottom-0 left-0 right-0 z-[101] bg-neutral-900 rounded-t-[32px] border-t border-neutral-800 p-6 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-neutral-800 px-3 py-1.5 rounded-full">
                  <span className="text-amber-500">💰</span>
                  <span className="font-bold text-sm">{formatNumber(userCoins)}</span>
                </div>
                <div className="flex bg-neutral-800 rounded-full p-1">
                  <button 
                    onClick={() => setActiveTab('gifts')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'gifts' ? 'bg-amber-500 text-black' : 'text-neutral-400'}`}
                  >
                    هدايا
                  </button>
                  <button 
                    onClick={() => setActiveTab('lucky')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'lucky' ? 'bg-amber-500 text-black' : 'text-neutral-400'}`}
                  >
                    صندوق الحظ
                  </button>
                </div>
              </div>
              <button onClick={onClose} className="p-2 bg-neutral-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeTab === 'gifts' ? (
              <div className="space-y-6">
                {/* Recipient Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-500 flex items-center gap-2">
                      <Users className="w-3 h-3" />
                      إرسال إلى
                    </label>
                    {selectedRecipient && (
                      <button 
                        onClick={() => setSelectedRecipient(null)}
                        className="text-[10px] text-amber-500 font-bold"
                      >
                        تغيير
                      </button>
                    )}
                  </div>
                  
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {roomUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => setSelectedRecipient({ id: u.id, name: u.username })}
                        className={`flex flex-col items-center gap-1 shrink-0 transition-all ${selectedRecipient?.id === u.id ? 'scale-110' : 'opacity-60'}`}
                      >
                        <div className={`w-12 h-12 rounded-full border-2 p-0.5 ${selectedRecipient?.id === u.id ? 'border-amber-500' : 'border-transparent'}`}>
                          <img src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-full h-full rounded-full object-cover" />
                        </div>
                        <span className="text-[10px] font-bold truncate w-16 text-center">{u.username}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gifts Grid */}
                <div className="grid grid-cols-4 gap-4">
                  {GIFTS_CATALOG.map((gift) => (
                    <button
                      key={gift.id}
                      onClick={() => {
                        if (selectedRecipient) {
                          onSend(gift, selectedRecipient.id, selectedRecipient.name);
                        } else {
                          alert("يرجى اختيار مستلم أولاً");
                        }
                      }}
                      disabled={userCoins < gift.cost}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-neutral-800/50 hover:bg-neutral-800 transition-colors disabled:opacity-50 group"
                    >
                      <span className="text-3xl group-hover:scale-110 transition-transform">{gift.iconUrl}</span>
                      <span className="text-[10px] font-bold truncate w-full text-center">{gift.name}</span>
                      <div className="flex items-center gap-1 text-[10px] text-amber-500">
                        <span>{gift.cost}</span>
                        <span>🪙</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6 py-4">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Box className="w-10 h-10 text-black" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-lg">صندوق الحظ العشوائي</h3>
                    <p className="text-xs text-neutral-400 mt-1">وزع العملات على أعضاء الغرفة بشكل عشوائي</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500">إجمالي العملات</label>
                    <input 
                      type="number" 
                      value={luckyAmount}
                      onChange={(e) => setLuckyAmount(Number(e.target.value))}
                      className="w-full bg-neutral-800 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500">عدد الفائزين</label>
                    <input 
                      type="number" 
                      value={luckyWinners}
                      onChange={(e) => setLuckyWinners(Number(e.target.value))}
                      className="w-full bg-neutral-800 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                <button
                  onClick={() => onDropLuckyBox(luckyAmount, luckyWinners)}
                  disabled={userCoins < luckyAmount}
                  className="w-full bg-amber-500 text-black font-bold py-4 rounded-2xl hover:bg-amber-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <GiftIcon className="w-5 h-5" />
                  <span>إلقاء الصندوق ({luckyAmount} عملة)</span>
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
