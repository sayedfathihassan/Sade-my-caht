import React from 'react';
import { cn } from '@/src/lib/utils';

interface ChatBubbleRendererProps {
  bubbleId?: string;
  children: React.ReactNode;
  className?: string;
}

export function ChatBubbleRenderer({ bubbleId, children, className }: ChatBubbleRendererProps) {
  // Default styling if no bubble is equipped
  if (!bubbleId) {
    return (
      <div className={cn("bg-white/10 text-white rounded-2xl rounded-tr-none px-4 py-2 text-sm", className)}>
        {children}
      </div>
    );
  }

  // Base classes for the inner content container
  const contentClasses = "relative z-10 px-4 py-2 text-sm font-medium";
  
  // Base classes for the outer wrapper
  const wrapperClasses = cn("relative rounded-2xl rounded-tr-none min-w-[120px]", className);

  switch (bubbleId) {
    case 'bubble_royal_gold':
      return (
        <div className={wrapperClasses}>
          <div className="absolute inset-0 bg-gradient-to-r from-amber-200 to-yellow-400 rounded-2xl rounded-tr-none p-[2px]">
            <div className="absolute inset-0 bg-gradient-to-r from-red-900/90 to-amber-900/90 rounded-2xl rounded-tr-none backdrop-blur-sm" />
          </div>
          {/* Crown Decoration */}
          <svg className="absolute -top-3 -left-2 w-6 h-6 drop-shadow-md z-20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 60 L20 20 L40 40 L50 10 L60 40 L80 20 L90 60 Z" fill="#FFDF00" stroke="#B8860B" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M10 60 L90 60 L85 80 L15 80 Z" fill="#FFDF00" stroke="#B8860B" strokeWidth="2" strokeLinejoin="round"/>
            <circle cx="50" cy="5" r="5" fill="#FFD700" />
            <circle cx="50" cy="70" r="3" fill="#FF4500" />
          </svg>
          <div className={cn(contentClasses, "text-amber-50")}>
            {children}
          </div>
        </div>
      );

    case 'bubble_starry_purple':
      return (
        <div className={wrapperClasses}>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-2xl rounded-tr-none p-[2px]">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 to-indigo-900/90 rounded-2xl rounded-tr-none backdrop-blur-sm" />
          </div>
          {/* Stars Decoration */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full blur-[1px] animate-pulse" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-purple-200 rounded-full blur-[1px] animate-pulse delay-75" />
          <div className={cn(contentClasses, "text-purple-50")}>
            {children}
          </div>
        </div>
      );

    case 'bubble_neon_gamer':
      return (
        <div className={wrapperClasses}>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-2xl rounded-tr-none p-[2px]">
            <div className="absolute inset-0 bg-neutral-900/95 rounded-2xl rounded-tr-none backdrop-blur-sm" />
          </div>
          {/* Neon Glow */}
          <div className="absolute inset-0 rounded-2xl rounded-tr-none shadow-[0_0_10px_rgba(6,182,212,0.5)] pointer-events-none" />
          <div className={cn(contentClasses, "text-cyan-50")}>
            {children}
          </div>
        </div>
      );

    case 'bubble_pink_hearts':
      return (
        <div className={wrapperClasses}>
          <div className="absolute inset-0 bg-gradient-to-r from-pink-300 to-rose-300 rounded-2xl rounded-tr-none p-[2px]">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-900/90 to-rose-900/90 rounded-2xl rounded-tr-none backdrop-blur-sm" />
          </div>
          {/* Hearts Decoration */}
          <svg className="absolute -top-2 -right-2 w-5 h-5 drop-shadow-md z-20 animate-bounce" viewBox="0 0 24 24" fill="#FF69B4" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <div className={cn(contentClasses, "text-pink-50")}>
            {children}
          </div>
        </div>
      );

    default:
      return (
        <div className={cn("bg-white/10 text-white rounded-2xl rounded-tr-none px-4 py-2 text-sm", className)}>
          {children}
        </div>
      );
  }
}
