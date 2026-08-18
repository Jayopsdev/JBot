import type { NextRequest } from "next/server";
import type { RealtimeEvent } from "@/lib/chat-types";
import {
  addCustomerPresence,
  realtimeBus,
  removeCustomerPresence,
} from "@/lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encode(event: unknown) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function GET(request: NextRequest) {
  const conversationId = request.nextUrl.searchParams.get("conversationId");
  const customerId = request.nextUrl.searchParams.get("customerId");
  const encoder = new TextEncoder();

  let cleanup = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: RealtimeEvent) => {
        controller.enqueue(encoder.encode(encode(event)));
      };

      send({ type: "connected" });

      if (customerId) {
        addCustomerPresence(customerId);
      }

      const onEvent = (event: RealtimeEvent) => {
        if (event.type === "connected") return;
        if (conversationId && event.type !== "presence") {
          if (
            "conversationId" in event &&
            event.conversationId !== conversationId
          ) {
            return;
          }
        }
        send(event);
      };

      realtimeBus.on("event", onEvent);

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: keepalive\n\n`));
      }, 15000);

      cleanup = () => {
        realtimeBus.off("event", onEvent);
        clearInterval(heartbeat);
        if (customerId) {
          removeCustomerPresence(customerId);
        }
      };

      request.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
