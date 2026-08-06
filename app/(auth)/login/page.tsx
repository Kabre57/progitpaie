"use client";

import { useState } from "react";
import { AuthUI } from "@/components/ui/auth-fuse";

interface LoginResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    user: {
      id: string;
      _id: string;
      name: string;
      role: "super_admin" | "admin" | "employee";
      mustChangePassword?: boolean;
    };
  };
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result: LoginResponse = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || "Échec de connexion. Veuillez vérifier vos identifiants.");
        setIsLoading(false);
        return;
      }

      // Vérifier si le changement de mot de passe est obligatoire à la 1ère connexion
      if (result.data?.user?.mustChangePassword) {
        window.location.href = "/change-password";
        return;
      }

      // Redirection selon le rôle utilisateur
      const userRole = result.data?.user?.role;
      if (userRole === "super_admin") {
        window.location.href = "/super-admin/dashboard";
      } else if (userRole === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/employee";
      }
    } catch (err) {
      setError("Une erreur inattendue est survenue. Veuillez réessayer.");
      console.error("Login error:", err);
      setIsLoading(false);
    }
  };

  return (
    <AuthUI
      onSignInSubmit={handleSignIn}
      isLoading={isLoading}
      error={error}
      signInContent={{
        quote: {
          text: "Ravi de vous revoir ! Suivez les pointages, gérez les congés et simplifiez la paie de vos équipes.",
          author: "Équipe PROGITPAIE"
        }
      }}
    />
  );
}
