"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const neuButtonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer outline-none select-none rounded-[0.5rem] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "bg-[#666cff] hover:bg-[#5c61e6] text-white shadow-[0px_4px_14px_0px_rgba(102,108,255,0.4)] border border-[#666cff]/40",
        accent: "bg-[#666cff] hover:bg-[#5c61e6] text-white shadow-[0px_4px_14px_0px_rgba(102,108,255,0.4)] border border-[#666cff]/40",
        ghost: "bg-[#3a3e5b]/70 hover:bg-[#3a3e5b] text-[#b0b4d0] hover:text-white border border-white/10 shadow-sm",
        danger: "bg-[#ff4d49] hover:bg-[#e64542] text-white shadow-[0px_4px_14px_0px_rgba(255,77,73,0.4)] border border-[#ff4d49]/40",
        outline: "bg-transparent text-[#eaeaff] border border-[#666cff]/50 hover:bg-[#666cff]/10 hover:border-[#666cff]",
      },
      size: {
        md: "px-4 py-2.5 text-sm gap-2",
        sm: "px-3 py-1.5 text-xs gap-1.5",
        lg: "px-6 py-3 text-base gap-2.5",
        icon: "w-9 h-9 p-0 rounded-lg justify-center",
        full: "w-full py-2.5 text-sm gap-2 justify-center",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface NeuButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof neuButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const NeuButton = React.forwardRef<HTMLButtonElement, NeuButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(neuButtonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </Comp>
    );
  }
);

NeuButton.displayName = "NeuButton";

export { NeuButton };
