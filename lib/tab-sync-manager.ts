/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Synchronisation Inter-Onglets (BroadcastChannel API + Fallback) 🔄
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export type TabSyncEventType =
  | "AUTH_LOGOUT"
  | "AUTH_LOGIN"
  | "PROFILE_UPDATED"
  | "ATTENDANCE_UPDATED"
  | "SETTINGS_CHANGED";

export interface TabSyncMessage<T = unknown> {
  id: string;
  type: TabSyncEventType;
  payload: T;
  timestamp: number;
  senderTabId: string;
}

function isTabSyncMessage(value: unknown): value is TabSyncMessage {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.type === "string" &&
    Object.values<TabSyncEventType>({
      AUTH_LOGOUT: "AUTH_LOGOUT",
      AUTH_LOGIN: "AUTH_LOGIN",
      PROFILE_UPDATED: "PROFILE_UPDATED",
      ATTENDANCE_UPDATED: "ATTENDANCE_UPDATED",
      SETTINGS_CHANGED: "SETTINGS_CHANGED",
    }).includes(candidate.type as TabSyncEventType) &&
    typeof candidate.timestamp === "number" &&
    typeof candidate.senderTabId === "string"
  );
}

const CHANNEL_NAME = "progitpaie_tab_sync_channel";
const TAB_ID = typeof Math !== "undefined" ? Math.random().toString(36).substring(7) : "tab-main";

class TabSyncManager {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, Array<(message: TabSyncMessage) => void>> = new Map();
  private lastProcessedTimestamp: Map<string, number> = new Map();

  constructor() {
    if (typeof window !== "undefined") {
      if (typeof BroadcastChannel !== "undefined") {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => this.handleIncomingMessage(event.data);
      } else {
        // Fallback StorageEvent pour les anciens navigateurs
        window.addEventListener("storage", (event: StorageEvent) => {
          if (event.key === CHANNEL_NAME && event.newValue) {
            try {
              const msg: unknown = JSON.parse(event.newValue);
              this.handleIncomingMessage(msg);
            } catch {
              // Ignorer les données de stockage non valides.
            }
          }
        });
      }
    }
  }

  private handleIncomingMessage(message: unknown) {
    if (!isTabSyncMessage(message)) return;
    const msg = message;

    // 🛡️ Filtre Anti-Boucle Infinie & Ignorer ses propres messages
    if (msg.senderTabId === TAB_ID) return;

    // Last-Write-Wins (LWW) : Ignorer les messages plus anciens
    const lastTime = this.lastProcessedTimestamp.get(msg.type) || 0;
    if (msg.timestamp < lastTime) return;

    this.lastProcessedTimestamp.set(msg.type, msg.timestamp);

    const callbacks = this.listeners.get(msg.type) || [];
    callbacks.forEach((cb) => cb(msg));
  }

  public publish<T>(type: TabSyncEventType, payload: T) {
    const message: TabSyncMessage<T> = {
      id: Math.random().toString(36).substring(7),
      type,
      payload,
      timestamp: Date.now(),
      senderTabId: TAB_ID,
    };

    if (this.channel) {
      this.channel.postMessage(message);
    } else if (typeof window !== "undefined") {
      localStorage.setItem(CHANNEL_NAME, JSON.stringify(message));
    }
  }

  public subscribe(type: TabSyncEventType, callback: (message: TabSyncMessage) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)?.push(callback);

    return () => {
      const callbacks = this.listeners.get(type) || [];
      this.listeners.set(
        type,
        callbacks.filter((cb) => cb !== callback)
      );
    };
  }
}

export const tabSyncManager = new TabSyncManager();
