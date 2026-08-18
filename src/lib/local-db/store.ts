import { useSyncExternalStore } from "react";
import { createSeedDatabase } from "@/lib/local-db/seed";
import {
  AGENT_ID_KEY,
  DB_EVENT,
  REALTIME_EVENT,
  STORAGE_KEY,
  type AppDatabase,
} from "@/lib/local-db/types";
import type { RealtimeEvent } from "@/lib/chat-types";

const serverSnapshot: AppDatabase | null = null;
let snapshot: AppDatabase | null = null;
let snapshotRaw: string | null = null;
let memoryDatabase: AppDatabase | null = null;

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function newId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${random}`;
}

export function getCurrentAgentId() {
  if (!canUseStorage()) return "user_alex";
  try {
    return localStorage.getItem(AGENT_ID_KEY) ?? "user_alex";
  } catch {
    return "user_alex";
  }
}

export function setCurrentAgentId(agentId: string) {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(AGENT_ID_KEY, agentId);
  } catch {
    // ignore quota / private-mode failures
  }
}

export function clearCurrentAgentId() {
  if (!canUseStorage()) return;
  try {
    localStorage.removeItem(AGENT_ID_KEY);
  } catch {
    // ignore
  }
}

function isAppDatabase(value: unknown): value is AppDatabase {
  if (!value || typeof value !== "object") return false;
  const db = value as AppDatabase;
  return (
    Array.isArray(db.users) &&
    Array.isArray(db.customers) &&
    Array.isArray(db.conversations) &&
    Array.isArray(db.messages) &&
    Array.isArray(db.tickets) &&
    Array.isArray(db.notes) &&
    Array.isArray(db.tags) &&
    Array.isArray(db.customerTags) &&
    Array.isArray(db.notifications) &&
    Array.isArray(db.activities) &&
    Array.isArray(db.onlineCustomerIds)
  );
}

function readMemoryDatabase() {
  memoryDatabase ??= createSeedDatabase();
  return memoryDatabase;
}

export function getDatabase(): AppDatabase {
  if (!canUseStorage()) {
    return readMemoryDatabase();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      if (raw === snapshotRaw && snapshot) return snapshot;
      const parsed = JSON.parse(raw) as unknown;
      if (isAppDatabase(parsed)) {
        snapshot = parsed;
        snapshotRaw = raw;
        return parsed;
      }
    }

    const seeded = createSeedDatabase();
    const rawSeed = JSON.stringify(seeded);
    localStorage.setItem(STORAGE_KEY, rawSeed);
    snapshot = seeded;
    snapshotRaw = rawSeed;
    return seeded;
  } catch {
    return readMemoryDatabase();
  }
}

export function persistDatabase(db: AppDatabase) {
  snapshot = db;
  if (!canUseStorage()) {
    memoryDatabase = db;
    return;
  }
  try {
    const raw = JSON.stringify(db);
    localStorage.setItem(STORAGE_KEY, raw);
    snapshotRaw = raw;
    window.dispatchEvent(new Event(DB_EVENT));
  } catch {
    memoryDatabase = db;
  }
}

export function emitRealtime(event: RealtimeEvent) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(REALTIME_EVENT, { detail: event }));
}

export function updateDatabase(
  mutator: (db: AppDatabase) => RealtimeEvent[] | void,
) {
  const db = getDatabase();
  const events = mutator(db) ?? [];
  persistDatabase(db);
  for (const event of events) {
    emitRealtime(event);
  }
  return db;
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  const onLocal = () => onStoreChange();
  const onStorage = (event: StorageEvent) => {
    if (event.key && event.key !== STORAGE_KEY) return;
    snapshot = null;
    snapshotRaw = null;
    onStoreChange();
  };

  window.addEventListener(DB_EVENT, onLocal);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(DB_EVENT, onLocal);
    window.removeEventListener("storage", onStorage);
  };
}

function getClientSnapshot() {
  return getDatabase();
}

function getServerSnapshot() {
  return serverSnapshot;
}

export function useDatabase() {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
