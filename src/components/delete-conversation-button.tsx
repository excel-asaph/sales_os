"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
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
import { deleteConversation } from "@/app/dashboard/[id]/actions";

// deleteConversation is a hard, cascading delete (messages, remembered
// facts, follow-ups, the event log — all gone, no undo) — only reachable
// here at all because the conversation has zero orders (actions.ts guards
// payment history separately). No conditional wording needed the way
// Resolve has: unlike resolving, there's no "safe" case for a delete,
// just a permanent one, so this always shows the same strong warning.
// No close-on-success handling needed either — a successful delete
// redirects away from this page entirely (deleteConversation itself
// calls redirect()), which unmounts this dialog along with everything
// else on the page.
export function DeleteConversationButton({ conversationId }: { conversationId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>
        <Trash2 />
        <span className="hidden sm:inline">Delete</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this conversation?</DialogTitle>
          <DialogDescription>
            This permanently deletes the conversation and everything tied to it — every message, remembered
            fact, and follow-up, plus its event log. This can&apos;t be undone. (Only available here because
            this conversation has no orders — anything with payment history has to be resolved instead, not
            deleted.)
          </DialogDescription>
        </DialogHeader>
        <form action={deleteConversation}>
          <input type="hidden" name="conversationId" value={conversationId} />
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
            <SubmitButton variant="destructive" pendingLabel="Deleting…">
              Delete permanently
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
