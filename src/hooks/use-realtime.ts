import { useEffect, useRef, useState } from "react";
import type { RealtimeEvent } from "@/lib/chat-types";
import { REALTIME_EVENT, STORAGE_KEY } from "@/lib/local-db/types";
import { requestJson } from "@/lib/request-json";
import type { AppDatabase } from "@/lib/local-db/types";

export type ConnectionState = "connecting" | "connected" | "reconnecting";

export function useRealtime(
  onEvent: (event: RealtimeEvent) => void,
  query = "",
  enabled = true,
) {
  const [status, setStatus] = useState<ConnectionState>("connecting");
  const handlerRef = useRef(onEvent);

  useEffect(() => {
    handlerRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const params = new URLSearchParams(
      query.startsWith("?") ? query.slice(1) : query,
    );
    const conversationId = params.get("conversationId");
    const customerId = params.get("customerId");

    const connectTimer = window.setTimeout(() => {
      setStatus("connected");
      handlerRef.current({ type: "connected" });
    }, 0);

    if (customerId) {
      void requestJson("/api/presence", {
        method: "POST",
        body: JSON.stringify({ customerId, online: true }),
      }).catch(() => undefined);
    }

    const onRealtime = (event: Event) => {
      const detail = (event as CustomEvent<RealtimeEvent>).detail;
      if (!detail || detail.type === "connected") return;
      if (conversationId && detail.type !== "presence") {
        if ("conversationId" in detail && detail.conversationId !== conversationId) {
          return;
        }
      }
      handlerRef.current(detail);
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        const db = JSON.parse(event.newValue) as AppDatabase;
        if (db.typing) {
          if (
            !conversationId ||
            db.typing.conversationId === conversationId
          ) {
            handlerRef.current({
              type: "typing",
              conversationId: db.typing.conversationId,
              senderType: db.typing.senderType,
            });
          }
        }
      } catch {
        // ignore malformed storage payloads
      }
    };

    window.addEventListener(REALTIME_EVENT, onRealtime);
    window.addEventListener("storage", onStorage);

    return () => {
      window.clearTimeout(connectTimer);
      window.removeEventListener(REALTIME_EVENT, onRealtime);
      window.removeEventListener("storage", onStorage);
      if (customerId) {
        void requestJson("/api/presence", {
          method: "POST",
          body: JSON.stringify({ customerId, online: false }),
        }).catch(() => undefined);
      }
    };
  }, [query, enabled]);

  return status;
}
