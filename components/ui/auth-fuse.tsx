"use client";

import * as React from "react";
import { useState, useId, useEffect } from "react";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff, X, Clock } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";

import { ComingSoonModal } from "./auth/coming-soon-modal";
import { Typewriter } from "./auth/typewriter";
import { SignInForm } from "./auth/sign-in-form";
import { SignUpForm } from "./auth/sign-up-form";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Dynamically import NeuralBackground to avoid SSR issues
const NeuralBackground = dynamic(
  () => import("@/components/ui/flow-field-background"),
  { ssr: false }
);

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[var(--neu-text)]"
);

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

const buttonVariants = cva(
  "group relative flex flex-col items-center justify-center decoration-0 transition-transform active:scale-95 cursor-pointer outline-none font-medium overflow-hidden",
  {
    variants: {
      variant: {
        default: "",
        link: "text-[var(--neu-accent)] hover:text-[var(--neu-accent-hover)] underline-offset-4 hover:underline",
        outline: "",
        ghost: "bg-transparent",
      },
      size: {
        default: "w-full h-[50px] rounded-xl text-[15px]",
        lg: "w-full h-[60px] rounded-2xl text-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    if (variant === "link") {
      return (
        <Comp
          ref={ref}
          className={cn(buttonVariants({ variant, size, className }))}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        ref={ref}
        className={cn(
          "group relative flex flex-col items-center justify-center decoration-0 transition-transform active:scale-95 cursor-pointer outline-none font-medium overflow-hidden",
          size === "lg" ? "w-full h-[60px] rounded-2xl text-xl" : "w-full h-[50px] rounded-xl text-[15px]",
          className
        )}
        style={{
          backgroundColor: variant === "ghost" ? "transparent" : "rgba(255, 255, 255, 0.05)",
        }}
        {...props}
      >
        <span className="relative w-full h-full flex items-center justify-center">
          {/* Glow Layers - only for non-ghost/link buttons */}
          {variant !== "ghost" && (
            <>
              <div
                className="absolute inset-0 pointer-events-none transition-opacity ease-in-out duration-[1200ms] opacity-100 group-hover:opacity-0"
                style={{
                  background: "radial-gradient(15% 50% at 50% 100%, rgb(255, 255, 255) 0%, rgba(255, 255, 255, 0) 100%)",
                  borderRadius: "inherit",
                  filter: "blur(15px)",
                }}
              />
              <div
                className="absolute inset-0 pointer-events-none transition-opacity ease-in-out duration-[1200ms] opacity-0 group-hover:opacity-100"
                style={{
                  background: "radial-gradient(60.6% 50% at 50% 100%, rgb(255, 255, 255) 0%, rgba(255, 255, 255, 0) 100%)",
                  borderRadius: "inherit",
                  filter: "blur(18px)",
                }}
              />
            </>
          )}

          {/* Fill Layer */}
          <div
            className="absolute inset-[1px] pointer-events-none z-10 rounded-[inherit]"
            style={{
              backgroundColor: variant === "ghost" ? "transparent" : "rgb(0, 0, 0)",
              opacity: 1,
            }}
          />

          {/* Text Content */}
          <div className="relative z-20 flex items-center justify-center opacity-100 gap-2 shrink-0 px-4 text-white">
            {children}
          </div>
        </span>
      </Comp>
    );
  }
);
Button.displayName = "Button";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl bg-[var(--neu-bg)] px-4 py-3 text-sm text-[var(--neu-text)] shadow-[inset_2px_2px_4px_var(--neu-shadow-dark),inset_-2px_-2px-4px_var(--neu-shadow-light)] border-none placeholder:text-[var(--neu-text-secondary)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neu-accent)]/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, ...props }, ref) => {
    const id = useId();
    const [showPassword, setShowPassword] = useState(false);
    const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

    return (
      <div className="grid w-full items-center gap-2">
        {label && <Label htmlFor={id}>{label}</Label>}
        <div className="relative">
          <Input
            id={id}
            type={showPassword ? "text" : "password"}
            className={cn("pe-12", className)}
            ref={ref}
            {...props}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 end-0 flex h-full w-12 items-center justify-center text-[var(--neu-text-secondary)] hover:text-[var(--neu-text)] transition-colors"
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
          </button>
        </div>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";


interface AuthFormContainerProps {
  isSignIn: boolean;
  onToggle: () => void;
  onSignInSubmit: (data: { email: string; password: string }) => void;
  onSignUpSubmit: (data: { name: string; email: string; password: string; department?: string }) => void;
  isLoading?: boolean;
  error?: string | null;
  onGoogleClick: () => void;
}

function AuthFormContainer({
  isSignIn,
  onToggle,
  onSignInSubmit,
  onSignUpSubmit,
  isLoading,
  error,
  onGoogleClick,
}: AuthFormContainerProps) {
  return (
    <div className="mx-auto grid w-full max-w-[380px] gap-4">
      {isSignIn ? (
        <SignInForm onSubmit={onSignInSubmit} isLoading={isLoading} error={error} />
      ) : (
        <SignUpForm onSubmit={onSignUpSubmit} isLoading={isLoading} error={error} />
      )}

      <div className="text-center text-sm">
        <span className="text-[var(--neu-text-secondary)]">
          {isSignIn ? "Vous n'avez pas de compte ?" : "Vous avez déjà un compte ?"}{" "}
        </span>
        <Button variant="link" className="p-0 h-auto" onClick={onToggle}>
          {isSignIn ? "S'inscrire" : "Se connecter"}
        </Button>
      </div>

      <div className="relative text-center text-sm">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--neu-border)]"></div>
        </div>
        <span className="relative z-10 bg-[var(--neu-bg)] px-4 text-[var(--neu-text-secondary)]">
          Ou continuer avec
        </span>
      </div>

      <Button variant="outline" type="button" onClick={onGoogleClick} className="w-full">
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continuer avec Google
      </Button>
    </div>
  );
}

interface AuthContentProps {
  image?: {
    src: string;
    alt: string;
  };
  quote?: {
    text: string;
    author: string;
  };
}

interface AuthUIProps {
  signInContent?: AuthContentProps;
  signUpContent?: AuthContentProps;
  onSignInSubmit?: (data: { email: string; password: string }) => void;
  onSignUpSubmit?: (data: { name: string; email: string; password: string; department?: string }) => void;
  isLoading?: boolean;
  error?: string | null;
}

const defaultSignInContent = {
  image: {
    src: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80",
    alt: "Modern office workspace"
  },
  quote: {
    text: "Welcome Back! The journey continues.",
    author: "progitpaie Team"
  }
};

const defaultSignUpContent = {
  image: {
    src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920&q=80",
    alt: "Collaboration d'équipe RH"
  },
  quote: {
    text: "Créez votre compte. Un nouveau chapitre commence pour votre entreprise.",
    author: "Équipe PROGITPAIE"
  }
};

export function AuthUI({
  signInContent = {},
  signUpContent = {},
  onSignInSubmit,
  onSignUpSubmit,
  isLoading,
  error,
}: AuthUIProps) {
  const [isSignIn, setIsSignIn] = useState(true);
  const [showComingSoon, setShowComingSoon] = useState(false);

  const toggleForm = () => setIsSignIn((prev) => !prev);

  const finalSignInContent = {
    image: { ...defaultSignInContent.image, ...signInContent.image },
    quote: { ...defaultSignInContent.quote, ...signInContent.quote },
  };
  const finalSignUpContent = {
    image: { ...defaultSignUpContent.image, ...signUpContent.image },
    quote: { ...defaultSignUpContent.quote, ...signUpContent.quote },
  };

  const currentContent = isSignIn ? finalSignInContent : finalSignUpContent;

  const handleSignIn = (data: { email: string; password: string }) => {
    onSignInSubmit?.(data);
  };

  const handleSignUp = (data: { name: string; email: string; password: string; department?: string }) => {
    onSignUpSubmit?.(data);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[var(--neu-bg)]">
      {/* Neural Background */}
      <div className="fixed inset-0 z-0">
        <NeuralBackground
          color="#818cf8"
          particleCount={600}
          speed={0.8}
          trailOpacity={0.15}
        />
      </div>

      {/* Coming Soon Modal */}
      <ComingSoonModal isOpen={showComingSoon} onClose={() => setShowComingSoon(false)} />

      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
      `}</style>

      {/* Back to Home button */}
      <Link
        href="/"
        className="absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--neu-surface)]/80 backdrop-blur-sm border border-[var(--neu-border)] text-[var(--neu-text-secondary)] hover:text-[var(--neu-accent)] hover:border-[var(--neu-accent)]/40 transition-all duration-200 text-sm font-medium"
      >
        <ArrowLeft size={16} />
        Retour à l'Accueil
      </Link>

      <div className="relative z-10 w-full min-h-screen md:grid md:grid-cols-2">
        {/* Form Side */}
        <div className="flex min-h-screen items-center justify-center p-6 md:h-auto md:p-12">
          <div className="w-full max-w-[400px]">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--neu-surface)] shadow-[6px_6px_12px_var(--neu-shadow-dark),-6px_-6px-12px_var(--neu-shadow-light)]">
                <Clock className="w-8 h-8 text-[var(--neu-accent)]" />
              </div>
            </div>

            <AuthFormContainer
              isSignIn={isSignIn}
              onToggle={toggleForm}
              onSignInSubmit={handleSignIn}
              onSignUpSubmit={handleSignUp}
              isLoading={isLoading}
              error={error}
              onGoogleClick={async () => {
                try {
                  const res = await fetch("/api/auth/google", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      email: "admin@attendance.com",
                      name: "Admin Google",
                      googleId: "google-oauth-demo-id",
                    }),
                  });
                  const result = await res.json();
                  if (result.success) {
                    window.location.href = result.data?.user?.role === "admin" ? "/admin" : "/employee";
                  }
                } catch (e) {
                  console.error("Google login failed:", e);
                }
              }}
            />
          </div>
        </div>

        {/* Image Side - Hidden on mobile */}
        <div
          className="hidden md:block relative bg-cover bg-center transition-all duration-500"
          style={{ backgroundImage: `url(${currentContent.image.src})` }}
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--neu-bg)]/90 via-[var(--neu-bg)]/40 to-transparent" />

          {/* Content */}
          <div className="relative z-10 flex h-full flex-col items-center justify-end p-8 pb-12">
            <blockquote className="space-y-2 text-center">
              <p className="text-xl md:text-2xl font-medium text-white drop-shadow-lg">
                "<Typewriter
                  key={currentContent.quote.text}
                  text={currentContent.quote.text}
                  speed={60}
                />"
              </p>
              <cite className="block text-sm font-light text-white/80 not-italic drop-shadow">
                — {currentContent.quote.author}
              </cite>
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
}
