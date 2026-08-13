"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Bot } from "lucide-react";
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
import { returnToAI } from "@/app/dashboard/[id]/actions";

// See CloseOnSuccess in resolve-conversation-button.tsx for why this has to
// live inside the form rather than just calling setOpen after await.
function CloseOnSuccess({ onDone }: { onDone: () => void }) {
  const { pending } = useFormStatus();
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending) onDone();
    wasPending.current = pending;
  }, [pending, onDone]);
  return null;
}

// Only ever shown on a HUMAN_REVIEW_REQUIRED/HUMAN_ASSIGNED conversation
// (see isHumanStage in page.tsx) — otherwise the AI already owns it and
// there's nothing to hand back. Submitting runs a real AI turn before this
// returns, so it can take a few seconds longer than the other action
// buttons here; the AI may reply to the customer right away if there's
// something to say.
export function ReturnToAIButton({ conversationId }: { conversationId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Bot />
        <span className="hidden sm:inline">Return to AI</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hand this conversation back to the AI?</DialogTitle>
          <DialogDescription>
            Only do this once whatever needed a human is actually resolved. The AI will immediately review where
            things stand and take over again — tagging, follow-ups, stage updates, and replying to the customer if
            there&apos;s something to say.
          </DialogDescription>
        </DialogHeader>
        <form action={returnToAI}>
          <input type="hidden" name="conversationId" value={conversationId} />
          <CloseOnSuccess onDone={() => setOpen(false)} />
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
            <SubmitButton pendingLabel="Returning…" successMessage="Handed back to the AI">
              Return to AI
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
