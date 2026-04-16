import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

const EMOJIS = [
  { id: "e1", char: "😂" },
  { id: "e2", char: "❤️" },
  { id: "e3", char: "🔥" },
  { id: "e4", char: "👏" },
  { id: "e5", char: "😮" },
  { id: "e6", char: "😢" },
  { id: "e7", char: "🎉" },
  { id: "e8", char: "💯" },
];

interface EmojiPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (emoji: string) => void;
}

export function EmojiPanel({ isOpen, onClose, onSend }: EmojiPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-900 rounded-t-[32px] border-t border-neutral-800 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-neutral-400">تفاعلات سريعة</h3>
              <button onClick={onClose} className="p-2 bg-neutral-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji.id}
                  onClick={() => {
                    onSend(emoji.char);
                    onClose();
                  }}
                  className="text-4xl p-4 rounded-2xl bg-neutral-800/50 hover:bg-neutral-800 transition-all active:scale-90"
                >
                  {emoji.char}
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
