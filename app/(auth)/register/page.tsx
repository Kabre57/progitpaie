"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthUI } from "@/components/ui/auth-fuse";

interface RegisterResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    _id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    createdAt: string;
  };
}

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (data: { name: string; email: string; password: string; department?: string; companyName?: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...data, mode: "demo" }),
      });

      const result: RegisterResponse = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || "Impossible de créer votre accès Démo. Veuillez réessayer.");
        setIsLoading(false);
        return;
      }

      // Redirect to login page on success
      router.push("/login");
    } catch (err) {
      setError("Une erreur est survenue pendant la création de votre accès Démo.");
      console.error("Registration error:", err);
      setIsLoading(false);
    }
  };

  return (
    <AuthUI
      onSignUpSubmit={handleSignUp}
      initialMode="signup"
      isLoading={isLoading}
      error={error}
      signUpContent={{
        quote: {
          text: "Testez PROGITPAIE gratuitement pendant 14 jours avec un espace Démo isolé.",
          author: "Équipe PROGITPAIE"
        }
      }}
    />
  );
}
