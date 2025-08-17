import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: ReactNode;
  variant?: "default" | "positive" | "negative" | "neutral";
  className?: string;
}

export const KPICard = ({ 
  title, 
  value, 
  change, 
  changeLabel,
  icon, 
  variant = "default",
  className = ""
}: KPICardProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "positive":
        return "border-green-500/30 bg-gradient-positive/10 shadow-[0_0_20px_rgba(16,185,129,0.2)]";
      case "negative":
        return "border-red-500/30 bg-gradient-negative/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]";
      case "neutral":
        return "border-yellow-500/30 bg-gradient-neutral/10 shadow-[0_0_20px_rgba(245,158,11,0.2)]";
      default:
        return "border-glass bg-gradient-card shadow-card";
    }
  };

  const getIconStyles = () => {
    switch (variant) {
      case "positive":
        return "bg-gradient-positive text-white";
      case "negative":
        return "bg-gradient-negative text-white";
      case "neutral":
        return "bg-gradient-neutral text-white";
      default:
        return "bg-brand-gradient text-white";
    }
  };

  return (
    <div className={`relative group p-6 rounded-2xl border backdrop-blur-sm hover:scale-[1.02] transition-all duration-300 hover:shadow-glow ${getVariantStyles()} ${className}`}>
      {/* Background glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="space-y-1">
            <p className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              {value}
            </p>
            {change !== undefined && (
              <div className="flex items-center gap-1 text-sm">
                {change > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={change > 0 ? "text-green-500" : "text-red-500"}>
                  {change > 0 ? "+" : ""}{change}%
                </span>
                {changeLabel && (
                  <span className="text-muted-foreground ml-1">{changeLabel}</span>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className={`p-3 rounded-xl ${getIconStyles()} shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
