"use client";

import { useEffect, useState } from "react";
import { NeuCard, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Bell, CheckCheck } from "lucide-react";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export default function EmployeeNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const url = filter === "unread" ? "/api/notifications?unreadOnly=true" : "/api/notifications";
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error("Échec de la récupération des notifications", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
      fetchNotifications();
    } catch (error) {
      console.error("Échec du marquage comme lu", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.isRead);
      await Promise.all(
        unreadNotifications.map((n) =>
          fetch(`/api/notifications/${n._id}/read`, { method: "PUT" })
        )
      );
      fetchNotifications();
    } catch (error) {
      console.error("Échec du marquage de toutes comme lues", error);
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "success": return "text-emerald-500 bg-emerald-500/10 border border-emerald-500/20";
      case "error": return "text-red-500 bg-red-500/10 border border-red-500/20";
      case "warning": return "text-amber-500 bg-amber-500/10 border border-amber-500/20";
      default: return "text-blue-500 bg-blue-500/10 border border-blue-500/20";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "À l'instant";
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)}h`;
    return `Il y a ${Math.floor(diffInSeconds / 86400)}j`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-[var(--neu-text)]">Mes Notifications</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setFilter("all")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === "all"
                  ? "bg-[var(--neu-accent)] text-white shadow-lg"
                  : "bg-[var(--neu-surface)] text-[var(--neu-text-secondary)] hover:bg-[var(--neu-surface-light)]"
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === "unread"
                  ? "bg-[var(--neu-accent)] text-white shadow-lg"
                  : "bg-[var(--neu-surface)] text-[var(--neu-text-secondary)] hover:bg-[var(--neu-surface-light)]"
              }`}
            >
              Non lues
            </button>
          </div>
          <NeuButton onClick={markAllAsRead} variant="ghost" size="sm" className="w-full sm:w-auto">
            <CheckCheck className="w-4 h-4 mr-1.5" />
            Tout marquer comme lu
          </NeuButton>
        </div>
      </div>

      {/* Liste des Notifications */}
      <NeuCard>
        <NeuCardContent className="p-6">
          {notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="Aucune notification"
              description={filter === "unread" ? "Vous n'avez aucune notification non lue." : "Vous n'avez aucune notification pour le moment."}
            />
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => markAsRead(notification._id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    notification.isRead
                      ? "bg-[var(--neu-bg)] border-[var(--neu-border)]"
                      : "bg-[var(--neu-accent)]/5 border-[var(--neu-accent)]/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(notification.type)}`}>
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-[var(--neu-text)]">
                          {notification.title}
                        </p>
                        <span className="text-xs text-[var(--neu-text-muted)]">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--neu-text-secondary)] mt-1">
                        {notification.message}
                      </p>
                      {!notification.isRead && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 bg-[var(--neu-accent)] rounded-full" />
                          <span className="text-[11px] font-bold text-[var(--neu-accent)] uppercase">Non lue</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </NeuCardContent>
      </NeuCard>
    </div>
  );
}
