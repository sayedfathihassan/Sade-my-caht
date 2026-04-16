import React from "react";
import { Room } from "@/src/types";
import { formatNumber } from "@/src/lib/utils";
import { Users, Crown } from "lucide-react";
import { motion } from "motion/react";

interface RoomCardProps {
  room: Room;
  onClick?: () => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative bg-neutral-900/50 rounded-2xl overflow-hidden border border-neutral-800 hover:border-amber-500/50 transition-all cursor-pointer"
    >
      {/* Cover Image */}
      <div className="aspect-square relative overflow-hidden">
        <img
          src={room.coverUrl || `https://picsum.photos/seed/${room.id}/400/400`}
          alt={room.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-80" />

        {/* Stats Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
            <Users className="w-3 h-3 text-amber-400" />
            <span>{formatNumber(room.memberCount)}</span>
          </div>
          {room.type === 'vip' && (
            <div className="bg-amber-500 text-black px-2 py-1 rounded-full flex items-center gap-1">
              <Crown className="w-3 h-3" />
              <span className="font-bold">VIP</span>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-bold text-sm truncate text-right" dir="rtl">
          {room.name}
        </h3>
        <p className="text-neutral-500 text-xs mt-1 truncate text-right" dir="rtl">
          {room.description || "أهلاً بكم في غرفتنا الصوتية"}
        </p>
      </div>
    </motion.div>
  );
}
