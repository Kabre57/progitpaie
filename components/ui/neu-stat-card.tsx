"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TrendDirection = "up" | "down" | "neutral";

interface NeuStatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: TrendDirection;
  trendValue?: string;
  gradient?: "primary" | "success" | "warning" | "danger" | "cyan";
}

const trendStyles: Record<TrendDirection, { color: string; icon: React.ReactNode }> = {
  up: {
    color: "text-[#72e128] font-semibold",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    ),
  },
  down: {
    color: "text-[#ff4d49] font-semibold",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    ),
  },
  neutral: {
    color: "text-[var(--neu-text-muted)] font-semibold",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
};

const badgeStyles: Record<string, string> = {
  primary: "bg-[#666cff]/10 text-[#666cff] dark:bg-[#666cff]/20 dark:text-[#8589ff]",
  success: "bg-[#72e128]/15 text-[#56b518] dark:bg-[#72e128]/20 dark:text-[#72e128]",
  warning: "bg-[#fdb528]/15 text-[#d49012] dark:bg-[#fdb528]/20 dark:text-[#fdb528]",
  danger: "bg-[#ff4d49]/15 text-[#ff4d49] dark:bg-[#ff4d49]/20 dark:text-[#ff716d]",
  cyan: "bg-[#26c6f9]/15 text-[#0eb1e4] dark:bg-[#26c6f9]/20 dark:text-[#26c6f9]",
};

const NeuStatCard = React.forwardRef<HTMLDivElement, NeuStatCardProps>(
  (
    { className, title, value, subtitle, icon, trend = "neutral", trendValue, gradient = "primary", ...props },
    ref
  ) => {
    const trendStyle = trendStyles[trend];

    return (
      <div
        ref={ref}
        className={cn(
          "p-5 rounded-[0.625rem]",
          "bg-[var(--neu-surface)] text-[var(--neu-text)]",
          "border border-[var(--neu-border)]",
          "shadow-sm",
          "transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md",
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-sm font-normal text-[var(--neu-text-secondary)] tracking-wide">
              {title}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[var(--neu-text)] font-sans">
                {value}
              </span>
              {trendValue && (
                <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold", trendStyle.color)}>
                  ({trendValue})
                </span>
              )}
            </div>
            {subtitle && (
              <p className="mt-1 text-xs text-[var(--neu-text-muted)]">
                {subtitle}
              </p>
            )}
          </div>
          {icon && (
            <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg shrink-0", badgeStyles[gradient])}>
              {icon}
            </div>
          )}
        </div>
      </div>
    );
  }
);

NeuStatCard.displayName = "NeuStatCard";

export { NeuStatCard, type NeuStatCardProps, type TrendDirection };
