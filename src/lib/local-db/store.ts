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
  return localStorage.getItem(AGENT_ID_KEY) ?? "user_alex";
}

export function setCurrentAgentId(agentId: string) {
  if (!canUseStorage()) return;
  localStorage.setItem(AGENT_ID_KEY, agentId);
}

export function clearCurrentAgentId() {
  if (!canUseStorage()) return;
  localStorage.removeItem(AGENT_ID_KEY);
}

function parseDatabase(raw: string): AppDatabase {
  return JSON.parse(raw) as AppDatabase;
}

export function getDatabase(): AppDatabase {
  if (!canUseStorage()) {
    return createSeedDatabase();
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    if (raw === snapshotRaw && snapshot) return snapshot;
    const parsed = parseDatabase(raw);
    snapshot = parsed;
    snapshotRaw = raw;
    return parsed;
  }

  const seeded = createSeedDatabase();
  persistDatabase(seeded);
  return seeded;
}

export function persistDatabase(db: AppDatabase) {
  if (!canUseStorage()) return;
  const raw = JSON.stringify(db);
  localStorage.setItem(STORAGE_KEY, raw);
  snapshot = db;
  snapshotRaw = raw;
  window.dispatchEvent(new Event(DB_EVENT));
}

export function emitRealtime(event: RealtimeEvent) {
  if (!canUseStorage()) return;
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
  if (!canUseStorage()) return () => {};

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
