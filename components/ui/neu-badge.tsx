"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "present" | "absent" | "late" | "default" | "accent" | "success" | "error" | "warning" | "info" | "danger" | "ghost";

interface NeuBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, { dot: string; bg: string; text: string }> = {
  present: {
    dot: "bg-[#72e128]",
    bg: "bg-[#72e128]/15 dark:bg-[#72e128]/20",
    text: "text-[#56b518] dark:text-[#72e128]",
  },
  absent: {
    dot: "bg-[#ff4d49]",
    bg: "bg-[#ff4d49]/15 dark:bg-[#ff4d49]/20",
    text: "text-[#ff4d49] dark:text-[#ff716d]",
  },
  late: {
    dot: "bg-[#fdb528]",
    bg: "bg-[#fdb528]/15 dark:bg-[#fdb528]/20",
    text: "text-[#d49012] dark:text-[#fdb528]",
  },
  default: {
    dot: "bg-[#6d788d]",
    bg: "bg-[#6d788d]/15 dark:bg-[#6d788d]/20",
    text: "text-[#6d788d] dark:text-[#b0b4d0]",
  },
  accent: {
    dot: "bg-[#666cff]",
    bg: "bg-[#666cff]/15 dark:bg-[#666cff]/20",
    text: "text-[#666cff] dark:text-[#8589ff]",
  },
  success: {
    dot: "bg-[#72e128]",
    bg: "bg-[#72e128]/15 dark:bg-[#72e128]/20",
    text: "text-[#56b518] dark:text-[#72e128]",
  },
  error: {
    dot: "bg-[#ff4d49]",
    bg: "bg-[#ff4d49]/15 dark:bg-[#ff4d49]/20",
    text: "text-[#ff4d49] dark:text-[#ff716d]",
  },
  danger: {
    dot: "bg-[#ff4d49]",
    bg: "bg-[#ff4d49]/15 dark:bg-[#ff4d49]/20",
    text: "text-[#ff4d49] dark:text-[#ff716d]",
  },
  warning: {
    dot: "bg-[#fdb528]",
    bg: "bg-[#fdb528]/15 dark:bg-[#fdb528]/20",
    text: "text-[#d49012] dark:text-[#fdb528]",
  },
  info: {
    dot: "bg-[#26c6f9]",
    bg: "bg-[#26c6f9]/15 dark:bg-[#26c6f9]/20",
    text: "text-[#0eb1e4] dark:text-[#26c6f9]",
  },
  ghost: {
    dot: "bg-[var(--neu-text-secondary)]",
    bg: "bg-transparent",
    text: "text-[var(--neu-text-secondary)]",
  },
};

const NeuBadge = React.forwardRef<HTMLSpanElement, NeuBadgeProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const styles = variantStyles[variant] || variantStyles.default;

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5",
          "rounded-full text-xs font-semibold tracking-wide",
          styles.bg,
          styles.text,
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            styles.dot
          )}
        />
        {children}
      </span>
    );
  }
);

NeuBadge.displayName = "NeuBadge";

export { NeuBadge, type NeuBadgeProps, type BadgeVariant };
