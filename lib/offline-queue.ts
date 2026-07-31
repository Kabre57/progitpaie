import { openDB, DBSchema } from "idb";

export interface OfflineAction {
  id?: number;
  url: string;
  method: "POST" | "PUT" | "DELETE";
  body: any;
  timestamp: string;
}

interface ProgitpaieDB extends DBSchema {
  offlineQueue: {
    key: number;
    value: OfflineAction;
  };
}

const DB_NAME = "progitpaie-offline-db";

export async function getDB() {
  return openDB<ProgitpaieDB>(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("offlineQueue")) {
        db.createObjectStore("offlineQueue", { keyPath: "id", autoIncrement: true });
      }
    },
  });
}

// Ajouter une action hors-ligne dans la file d'attente
export async function enqueueOfflineAction(action: Omit<OfflineAction, "id">) {
  const db = await getDB();
  await db.add("offlineQueue", action as OfflineAction);
  console.log("📥 [OFFLINE QUEUE] Action enregistrée pour synchronisation ultra-ultérieure:", action);
}

// Récupérer toutes les actions en attente
export async function getOfflineActions(): Promise<OfflineAction[]> {
  const db = await getDB();
  return db.getAll("offlineQueue");
}

// Synchroniser automatiquement la file d'attente lors du retour du réseau
export async function syncOfflineQueue() {
  const db = await getDB();
  const actions = await db.getAll("offlineQueue");

  if (actions.length === 0) return;

  console.log(`🔄 [SYNC] Synchronisation de ${actions.length} action(s) hors-ligne...`);

  for (const action of actions) {
    try {
      const res = await fetch(action.url, {
        method: action.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action.body),
      });

      if (res.ok && action.id) {
        await db.delete("offlineQueue", action.id);
        console.log(`✅ [SYNC] Action ${action.id} synchronisée et retirée.`);
      }
    } catch (err) {
      console.error(`❌ [SYNC] Échec de synchronisation pour l'action ${action.id}:`, err);
    }
  }
}
