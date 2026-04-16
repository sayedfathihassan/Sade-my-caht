import { useState } from "react";
import { User } from "@/src/types";
import { postService } from "@/src/services/postService";
import { motion, AnimatePresence } from "motion/react";
import { X, Image as ImageIcon, Send } from "lucide-react";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSuccess: () => void;
}

export function CreatePostModal({ isOpen, onClose, user, onSuccess }: CreatePostModalProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      await postService.createPost(user, content);
      setContent("");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to create post", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4" dir="rtl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-md bg-neutral-900 rounded-3xl border border-white/10 overflow-hidden"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-bold">نشر لحظة جديدة</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="ماذا يدور في ذهنك؟"
                className="w-full h-32 bg-black/40 border border-white/5 rounded-2xl p-4 text-sm focus:outline-none focus:border-amber-500/50 resize-none"
              />
              
              <div className="mt-6 flex items-center justify-between">
                <button className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors">
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-xs">إضافة صورة</span>
                </button>
                
                <button
                  onClick={handleSubmit}
                  disabled={!content.trim() || loading}
                  className="flex items-center gap-2 bg-amber-500 text-black font-bold px-6 py-2.5 rounded-xl hover:bg-amber-400 disabled:opacity-50 transition-all"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>نشر</span>
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
