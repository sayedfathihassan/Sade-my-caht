import { cn } from "@/src/lib/utils";

interface FrameRendererProps {
  frameId: string;
  className?: string;
}

export function FrameRenderer({ frameId, className }: FrameRendererProps) {
  // Common base for all frames
  const baseClasses = "absolute inset-0 z-20 pointer-events-none rounded-full flex items-center justify-center";

  switch (frameId) {
    case "frame_king_gold":
      return (
        <div className={cn(baseClasses, className)}>
          {/* Golden Ring */}
          <div className="absolute inset-[-4px] rounded-full border-[3px] border-transparent"
               style={{
                 background: "linear-gradient(white, white) padding-box, linear-gradient(to bottom right, #FFDF00, #D4AF37, #996515, #FFDF00) border-box",
                 boxShadow: "0 0 10px rgba(255, 215, 0, 0.5), inset 0 0 10px rgba(255, 215, 0, 0.5)"
               }} 
          />
          {/* Crown SVG */}
          <svg className="absolute -top-[25%] w-[60%] h-auto drop-shadow-lg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 60 L20 20 L40 40 L50 10 L60 40 L80 20 L90 60 Z" fill="url(#gold-gradient)" stroke="#B8860B" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M10 60 L90 60 L85 80 L15 80 Z" fill="url(#gold-gradient)" stroke="#B8860B" strokeWidth="2" strokeLinejoin="round"/>
            <circle cx="20" cy="15" r="4" fill="#FFD700" />
            <circle cx="50" cy="5" r="5" fill="#FFD700" />
            <circle cx="80" cy="15" r="4" fill="#FFD700" />
            <circle cx="50" cy="70" r="3" fill="#FF4500" />
            <circle cx="30" cy="70" r="2" fill="#00CED1" />
            <circle cx="70" cy="70" r="2" fill="#00CED1" />
            <defs>
              <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFDF00" />
                <stop offset="50%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#996515" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      );

    case "frame_royal_ribbon":
      return (
        <div className={cn(baseClasses, className)}>
          {/* Silver/Gold Ring */}
          <div className="absolute inset-[-3px] rounded-full border-[2px] border-transparent"
               style={{
                 background: "linear-gradient(white, white) padding-box, linear-gradient(to bottom, #E5E4E2, #B0C4DE, #E5E4E2) border-box",
                 boxShadow: "0 0 8px rgba(176, 196, 222, 0.6)"
               }} 
          />
          {/* Ribbon SVG */}
          <svg className="absolute -top-[15%] w-[50%] h-auto drop-shadow-md" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 20 Q 50 -10 90 20 L 80 40 Q 50 10 20 40 Z" fill="#DC143C" stroke="#8B0000" strokeWidth="1"/>
            <circle cx="50" cy="15" r="8" fill="url(#gold-gradient)" />
          </svg>
        </div>
      );

    case "frame_sun_gold":
      return (
        <div className={cn(baseClasses, className)}>
          {/* Sunburst Ring */}
          <div className="absolute inset-[-6px] rounded-full border-[2px] border-amber-500/50 border-dashed animate-[spin_10s_linear_infinite]" />
          <div className="absolute inset-[-2px] rounded-full border-[2px] border-amber-400"
               style={{ boxShadow: "0 0 15px #F59E0B, inset 0 0 10px #F59E0B" }} 
          />
        </div>
      );

    case "frame_luxury_ring":
      return (
        <div className={cn(baseClasses, className)}>
          {/* Double Gold Ring */}
          <div className="absolute inset-[-5px] rounded-full border-[1px] border-[#D4AF37]" />
          <div className="absolute inset-[-2px] rounded-full border-[2px] border-[#FFDF00]"
               style={{ boxShadow: "0 0 5px rgba(212, 175, 55, 0.5)" }} 
          />
          <div className="absolute inset-[1px] rounded-full border-[1px] border-[#996515]" />
        </div>
      );

    case "frame_pink_wings":
      return (
        <div className={cn(baseClasses, className)}>
          <div className="absolute inset-[-4px] rounded-full border-[3px] border-transparent"
               style={{
                 background: "linear-gradient(white, white) padding-box, linear-gradient(to bottom, #FF69B4, #FFB6C1, #FF69B4) border-box",
                 boxShadow: "0 0 12px rgba(255, 105, 180, 0.6), inset 0 0 8px rgba(255, 105, 180, 0.4)"
               }} 
          />
          {/* Wings SVG */}
          <svg className="absolute -left-[20%] top-1/2 -translate-y-1/2 w-[40%] h-auto drop-shadow-md" viewBox="0 0 50 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 50 Q 10 20 0 0 Q 20 30 40 40 Z" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="1"/>
            <path d="M40 50 Q 10 50 0 40 Q 20 60 40 60 Z" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="1"/>
            <path d="M40 50 Q 10 80 0 100 Q 20 70 40 60 Z" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="1"/>
          </svg>
          <svg className="absolute -right-[20%] top-1/2 -translate-y-1/2 w-[40%] h-auto drop-shadow-md scale-x-[-1]" viewBox="0 0 50 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 50 Q 10 20 0 0 Q 20 30 40 40 Z" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="1"/>
            <path d="M40 50 Q 10 50 0 40 Q 20 60 40 60 Z" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="1"/>
            <path d="M40 50 Q 10 80 0 100 Q 20 70 40 60 Z" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="1"/>
          </svg>
        </div>
      );

    case "frame_ocean_blue":
      return (
        <div className={cn(baseClasses, className)}>
          <div className="absolute inset-[-4px] rounded-full border-[3px] border-transparent"
               style={{
                 background: "linear-gradient(white, white) padding-box, linear-gradient(to bottom right, #00BFFF, #1E90FF, #0000CD) border-box",
                 boxShadow: "0 0 15px rgba(0, 191, 255, 0.6), inset 0 0 10px rgba(0, 191, 255, 0.4)"
               }} 
          />
          {/* Bubbles/Waves */}
          <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-blue-300/80 blur-[1px]" />
          <div className="absolute top-4 -right-4 w-3 h-3 rounded-full bg-blue-200/80 blur-[1px]" />
          <div className="absolute bottom-0 -left-2 w-6 h-6 rounded-full bg-cyan-400/60 blur-[2px]" />
        </div>
      );

    case "frame_fire_dragon":
      return (
        <div className={cn(baseClasses, className)}>
          <div className="absolute inset-[-5px] rounded-full border-[2px] border-red-500"
               style={{ boxShadow: "0 0 20px #FF0000, inset 0 0 15px #FF4500" }} 
          />
          <div className="absolute inset-[-2px] rounded-full border-[2px] border-orange-400 border-dashed animate-[spin_4s_linear_infinite]" />
          {/* Horns SVG */}
          <svg className="absolute -top-[15%] w-[80%] h-auto drop-shadow-lg" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 40 Q 10 10 0 0 Q 30 10 40 40 Z" fill="#FF4500" stroke="#8B0000" strokeWidth="1"/>
            <path d="M80 40 Q 90 10 100 0 Q 70 10 60 40 Z" fill="#FF4500" stroke="#8B0000" strokeWidth="1"/>
          </svg>
        </div>
      );

    case "frame_neon_cyber":
      return (
        <div className={cn(baseClasses, className)}>
          <div className="absolute inset-[-3px] rounded-full border-[2px] border-[#00FF00]"
               style={{ boxShadow: "0 0 15px #00FF00, inset 0 0 10px #00FF00" }} 
          />
          {/* Cyber accents */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-[#00FF00] rounded-sm" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-[#00FF00] rounded-sm" />
          <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-8 bg-[#00FF00] rounded-sm" />
          <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-8 bg-[#00FF00] rounded-sm" />
        </div>
      );

    default:
      // Fallback if it's an image URL or unknown ID
      return (
        <div className={cn(baseClasses, className)}>
          <img
            src={frameId}
            alt="frame"
            className="w-[135%] h-[135%] max-w-none object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
            referrerPolicy="no-referrer"
          />
        </div>
      );
  }
}
