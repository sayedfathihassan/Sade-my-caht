import { useState, useEffect, useRef } from "react";
import { User, PrivateMessage } from "@/src/types";
import { supabase } from "@/src/lib/supabase";
import { pusher } from "@/src/lib/pusher";
import { chatService } from "@/src/services/chatService";
import { taskService } from "@/src/services/taskService";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, ChevronRight } from "lucide-react";
import { UserAvatar } from "./UserAvatar";

interface PrivateMessageWindowProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  otherUser: User;
  conversationId: string;
}

export function PrivateMessageWindow({ isOpen, onClose, currentUser, otherUser, conversationId }: PrivateMessageWindowProps) {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !conversationId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('private_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (data) {
        setMessages(data.map(m => ({
          id: m.id,
          senderId: m.sender_id,
          content: m.content,
          timestamp: m.created_at,
          read: m.is_read
        })));
        chatService.markAsRead(conversationId, currentUser.id);
      }
    };

    fetchMessages();

    // Listen for new messages via Pusher
    const channel = pusher.subscribe(`private-${currentUser.id}`);
    channel.bind('new-message', (data: { conversationId: string, message: PrivateMessage }) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => [...prev, data.message]);
        chatService.markAsRead(conversationId, currentUser.id);
      }
    });

    return () => {
      pusher.unsubscribe(`private-${currentUser.id}`);
    };
  }, [isOpen, conversationId, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const content = input;
    setInput("");
    try {
      await chatService.sendMessage(conversationId, currentUser.id, otherUser.id, content, currentUser.username);
      await taskService.updateTaskProgress(currentUser.id, 'chat', 1);
    } catch (error) {
      console.error("Failed to send private message", error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="relative w-full max-w-md bg-neutral-900 rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/10 overflow-hidden flex flex-col h-[80vh] sm:h-[600px]"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-neutral-800/50">
              <div className="flex items-center gap-3">
                <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-full sm:hidden">
                  <ChevronRight className="w-6 h-6" />
                </button>
                <UserAvatar username={otherUser.username} src={otherUser.avatarUrl} size="sm" />
                <div>
                  <h3 className="text-sm font-bold">{otherUser.username}</h3>
                  <p className="text-[10px] text-neutral-400">نشط الآن</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full hidden sm:block">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      isMe 
                        ? 'bg-amber-500 text-black rounded-tr-none' 
                        : 'bg-neutral-800 text-white rounded-tl-none'
                    }`}>
                      {msg.content}
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-black/60' : 'text-neutral-500'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-neutral-800/50 border-t border-white/5">
              <div className="flex items-center gap-2 bg-black/40 rounded-2xl px-4 py-2 border border-white/10">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="اكتب رسالة..."
                  className="flex-1 bg-transparent border-none focus:outline-none text-sm py-2"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="p-2 bg-amber-500 text-black rounded-xl disabled:opacity-50 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
