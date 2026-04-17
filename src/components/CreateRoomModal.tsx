import { useState } from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import { supabase } from "@/src/lib/supabase";
import { motion, AnimatePresence } from "motion/react";
import { X, Camera, Shield, Globe, Lock } from "lucide-react";
import { generateRoomId } from "@/src/lib/utils";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (roomId: string) => void;
}

export function CreateRoomModal({ isOpen, onClose, onCreated }: CreateRoomModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [type, setType] = useState<'public' | 'private' | 'vip'>('public');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !user) return;
    
    const ROOM_COST = 900;
    if (user.coins < ROOM_COST) {
      alert(`تحتاج إلى ${ROOM_COST} عملة لإنشاء غرفة. رصيدك الحالي: ${user.coins}`);
      return;
    }

    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const response = await fetch('/api/room/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, type })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "فشل إنشاء الغرفة");

      onCreated(result.roomId);
      onClose();
    } catch (error: any) {
      console.error('Error creating room:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-neutral-900 rounded-[32px] border border-neutral-800 p-8 w-full max-w-md"
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">إنشاء غرفة جديدة</h2>
              <button onClick={onClose} className="p-2 bg-neutral-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-neutral-500 block mb-2 mr-1">اسم الغرفة</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثلاً: سهرة الأصدقاء"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl px-4 py-4 text-lg focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-500 block mb-3 mr-1">نوع الغرفة</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'public', label: 'عامة', icon: Globe },
                    { id: 'private', label: 'خاصة', icon: Lock },
                    { id: 'vip', label: 'VIP', icon: Shield },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setType(t.id as any)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                        type === t.id 
                          ? "bg-amber-500/10 border-amber-500 text-amber-500" 
                          : "bg-neutral-800 border-transparent text-neutral-400"
                      )}
                    >
                      <t.icon className="w-6 h-6" />
                      <span className="text-xs font-bold">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={loading || !name.trim()}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-black py-4 rounded-2xl text-lg shadow-xl shadow-amber-500/20 transition-all active:scale-95"
              >
                {loading ? "جاري الإنشاء..." : "ابدأ الآن"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
