import { useState, useEffect } from "react";
import { Notification } from "../types";
import { notificationService } from "../services/notificationService";
import { motion, AnimatePresence } from "motion/react";
import { Bell, X, MessageSquare, Megaphone, Gift, Info, Trash2, Check, UserPlus, Heart } from "lucide-react";
import { cn } from "../lib/utils";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onAction: (notification: Notification) => void;
}

export function NotificationPanel({ isOpen, onClose, userId, onAction }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !userId) return;
    const unsub = notificationService.subscribeToNotifications(userId, (data) => {
      setNotifications(data);
      setLoading(false);
    });
    return () => unsub();
  }, [isOpen, userId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'private_message': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'follow': return <UserPlus className="w-4 h-4 text-amber-500" />;
      case 'like': return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      case 'comment': return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'room_announcement': return <Megaphone className="w-4 h-4 text-amber-500" />;
      case 'gift_arrival': return <Gift className="w-4 h-4 text-rose-500" />;
      default: return <Info className="w-4 h-4 text-neutral-500" />;
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
            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-xs bg-neutral-950 z-[101] border-l border-white/10 flex flex-col"
            dir="rtl"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-amber-500" />
                <h2 className="text-xl font-bold">التنبيهات</h2>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {unreadCount > 0 && (
                <button 
                  onClick={() => notificationService.markAllAsRead(userId, notifications)}
                  className="w-full py-2 text-xs font-bold text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all flex items-center justify-center gap-2 mb-4"
                >
                  <Check className="w-4 h-4" />
                  تحديد الكل كمقروء
                </button>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-neutral-500 font-bold">جاري التحميل...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                  <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center">
                    <Bell className="w-8 h-8 text-neutral-700" />
                  </div>
                  <div>
                    <p className="font-bold text-neutral-400">لا توجد تنبيهات</p>
                    <p className="text-xs text-neutral-600 mt-1">سنخطرك عندما يحدث شيء جديد</p>
                  </div>
                </div>
              ) : (
                notifications.map((n) => (
                  <motion.div
                    layout
                    key={n.id}
                    className={cn(
                      "p-4 rounded-2xl border transition-all cursor-pointer relative group",
                      n.read ? "bg-neutral-900/40 border-white/5" : "bg-neutral-900 border-amber-500/30 shadow-lg shadow-amber-500/5"
                    )}
                    onClick={() => {
                      notificationService.markAsRead(n.id);
                      onAction(n);
                    }}
                  >
                    {!n.read && (
                      <div className="absolute top-4 left-4 w-2 h-2 bg-amber-500 rounded-full" />
                    )}
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getIcon(n.type)}</div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold mb-1">{n.title}</h4>
                        <p className="text-xs text-neutral-400 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-neutral-600 mt-2">
                          {new Date(n.createdAt).toLocaleDateString('ar-SA', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        notificationService.deleteNotification(n.id);
                      }}
                      className="absolute bottom-4 left-4 p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-red-500 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
