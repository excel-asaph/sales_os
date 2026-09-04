"use client";

import { useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Textarea } from "@/components/ui/textarea";
import { REPLY_SUBMITTED_EVENT } from "@/components/message-scroller";

// Enter sends (matching every chat app), Shift+Enter still inserts a
// newline for a multi-line reply. Must render inside the <form> — same
// requirement as SubmitButton (submit-button.tsx) — both so requestSubmit()
// has a form to target and so useFormStatus() reports the right form's
// pending state, guarding against a double-send from Enter while the
// previous reply is still in flight.
export function ReplyTextarea(props: React.ComponentProps<typeof Textarea>) {
  const { pending } = useFormStatus();

  // Tell the thread a send is in flight, so it scrolls to the new message
  // even if the agent had scrolled up to re-read history before replying.
  // Keyed off useFormStatus rather than an onSubmit handler so it fires for
  // both ways of sending: the button and the Enter key below.
  useEffect(() => {
    if (pending) window.dispatchEvent(new Event(REPLY_SUBMITTED_EVENT));
  }, [pending]);

  return (
    <Textarea
      {...props}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          if (pending) return;
          if (!e.currentTarget.value.trim()) return;
          e.currentTarget.form?.requestSubmit();
        }
      }}
    />
  );
}
