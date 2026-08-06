"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { resolveConversation } from "@/app/dashboard/[id]/actions";

// useFormStatus() only works as a descendant of the <form> it's tracking,
// so closing the dialog on a successful submit has to happen from inside
// the form itself — this watches the same pending->done transition
// SubmitButton already uses for its own toast, and reports it up.
function CloseOnSuccess({ onDone }: { onDone: () => void }) {
  const { pending } = useFormStatus();
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending) onDone();
    wasPending.current = pending;
  }, [pending, onDone]);
  return null;
}

// Resolving a conversation the AI is still actively mid-sale on (not yet
// escalated, not yet a final outcome) silently destroys its context: the
// customer's next message starts a brand new conversation with no memory
// of this one — found the hard way when a payment receipt landed in a
// fresh conversation instead of the one that had just requested it. This
// doesn't remove the ability to resolve early (a human may have good
// reason to), it just requires spelling out the actual consequence before
// they do, since "are you sure?" alone doesn't correct a mistaken belief
// about what state the conversation is in.
export function ResolveConversationButton({
  conversationId,
  requiresWarning,
}: {
  conversationId: string;
  requiresWarning: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>Mark resolved</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {requiresWarning && <AlertTriangle className="size-4 shrink-0 text-amber-500" />}
            {requiresWarning ? "This conversation is still active" : "Resolve this conversation?"}
          </DialogTitle>
          <DialogDescription>
            {requiresWarning
              ? "This hasn't been escalated to a human — the AI may still be mid-sale, waiting on the customer's next step. Resolving it now means their next message (even something like a payment receipt) starts a brand new conversation with no memory of this one."
              : "This closes out the thread. If the customer messages again, it'll start as a new conversation."}
          </DialogDescription>
        </DialogHeader>
        <form action={resolveConversation}>
          <input type="hidden" name="conversationId" value={conversationId} />
          <CloseOnSuccess onDone={() => setOpen(false)} />
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
            <SubmitButton
              variant={requiresWarning ? "destructive" : "outline"}
              pendingLabel="Resolving…"
              successMessage="Conversation resolved"
            >
              {requiresWarning ? "Resolve anyway" : "Resolve"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
