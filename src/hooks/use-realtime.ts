import { useEffect, useRef, useState } from "react";
import type { RealtimeEvent } from "@/lib/chat-types";

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

    const source = new EventSource(`/api/realtime${query}`);

    source.onopen = () => setStatus("connected");
    source.onerror = () => setStatus("reconnecting");
    source.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as RealtimeEvent;
        handlerRef.current(event);
      } catch {
        // ignore malformed payloads
      }
    };

    return () => source.close();
  }, [query, enabled]);

  return status;
}
