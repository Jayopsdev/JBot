import { EventEmitter } from "node:events";
import type { RealtimeEvent } from "@/lib/chat-types";

const globalForRealtime = globalThis as unknown as {
  supportHubRealtime?: EventEmitter;
  supportHubPresence?: Map<string, number>;
};

export const realtimeBus =
  globalForRealtime.supportHubRealtime ?? new EventEmitter();
realtimeBus.setMaxListeners(200);
globalForRealtime.supportHubRealtime = realtimeBus;

const presence =
  globalForRealtime.supportHubPresence ?? new Map<string, number>();
globalForRealtime.supportHubPresence = presence;

export function publishRealtime(event: RealtimeEvent) {
  realtimeBus.emit("event", event);
}

export function isCustomerOnline(customerId: string) {
  return (presence.get(customerId) ?? 0) > 0;
}

export function addCustomerPresence(customerId: string) {
  presence.set(customerId, (presence.get(customerId) ?? 0) + 1);
  publishRealtime({ type: "presence", customerId, online: true });
}

export function removeCustomerPresence(customerId: string) {
  const next = Math.max(0, (presence.get(customerId) ?? 0) - 1);
  if (next === 0) {
    presence.delete(customerId);
    publishRealtime({ type: "presence", customerId, online: false });
    return;
  }
  presence.set(customerId, next);
}