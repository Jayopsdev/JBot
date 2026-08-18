"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function MessageComposer({
  disabled,
  sending,
  placeholder,
  onSend,
  onTyping,
}: {
  disabled?: boolean;
  sending?: boolean;
  placeholder: string;
  onSend: (content: string) => Promise<void> | void;
  onTyping?: () => void;
}) {
  const [value, setValue] = useState("");

  async function submit() {
    const content = value.trim();
    if (!content || sending || disabled) return;
    setValue("");
    await onSend(content);
  }

  return (
    <div className="border-t bg-background p-3">
      <div className="flex items-end gap-2">
        <Textarea
          value={value}
          disabled={disabled || sending}
          placeholder={placeholder}
          className="min-h-11 max-h-32 resize-none"
          onChange={(event) => {
            setValue(event.target.value);
            onTyping?.();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
        />
        <Button
          type="button"
          className="h-11 px-3"
          disabled={disabled || sending || value.trim().length === 0}
          onClick={() => void submit()}
        >
          <Send className="size-4" />
          Send
        </Button>
      </div>
    </div>
  );
}
