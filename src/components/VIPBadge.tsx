import { Crown, ShieldCheck, Gem } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface VIPBadgeProps {
  tier: 'silver' | 'gold' | 'diamond';
  className?: string;
}

export function VIPBadge({ tier, className }: VIPBadgeProps) {
  const configs = {
    silver: {
      icon: ShieldCheck,
      color: "text-slate-300",
      bg: "bg-slate-300/20",
      border: "border-slate-300/30",
      label: "VIP فضي"
    },
    gold: {
      icon: Crown,
      color: "text-amber-400",
      bg: "bg-amber-400/20",
      border: "border-amber-400/30",
      label: "VIP ذهبي"
    },
    diamond: {
      icon: Gem,
      color: "text-cyan-400",
      bg: "bg-cyan-400/20",
      border: "border-cyan-400/30",
      label: "VIP ماسي"
    }
  };

  const config = configs[tier];
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-0.5 rounded-full border backdrop-blur-md",
      config.bg,
      config.border,
      className
    )}>
      <Icon className={cn("w-3 h-3", config.color)} />
      <span className={cn("text-[10px] font-black uppercase tracking-wider", config.color)}>
        {config.label}
      </span>
    </div>
  );
}
