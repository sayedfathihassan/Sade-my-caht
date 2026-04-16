import { cn } from "@/src/lib/utils";
import { FrameRenderer } from "./FrameRenderer";

interface UserAvatarProps {
  src?: string;
  username: string;
  level?: number;
  frameUrl?: string; // This will now act as the frameId
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function UserAvatar({ src, username, level, frameUrl, size = "md", className }: UserAvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  return (
    <div className={cn("relative flex items-center justify-center", sizeClasses[size], className)}>
      {/* Frame Glow (for premium feel) */}
      {frameUrl && (
        <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-xl animate-pulse z-0 scale-[1.35]" />
      )}

      {/* Frame Renderer */}
      {frameUrl && (
        <FrameRenderer frameId={frameUrl} />
      )}

      {/* Avatar Image */}
      <div className={cn(
        "w-full h-full rounded-full overflow-hidden border-2 border-neutral-800 bg-neutral-900 z-10 relative shadow-inner",
        frameUrl && "border-transparent" // FrameRenderer handles the border
      )}>
        <img
          src={src || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`}
          alt={username}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Level Badge */}
      {level !== undefined && (
        <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-yellow-500 to-amber-600 text-[10px] font-bold px-1.5 rounded-full border border-neutral-950 z-30 shadow-lg">
          {level}
        </div>
      )}
    </div>
  );
}
