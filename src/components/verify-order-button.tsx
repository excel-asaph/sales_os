"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { BadgeCheck } from "lucide-react";
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
import { verifyOrderManually } from "@/app/dashboard/[id]/actions";

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

// For an order the AI never got to verify — most often because the
// conversation escalated to a human over something unrelated before the
// receipt even arrived (a real, observed case: a customer's plain "Ok"
// escalated the conversation a minute before they sent the actual receipt,
// stranding it) — a human who has personally checked the receipt outside
// the AI's flow needs a way to reflect that here. Deliberately worded as a
// confirmation, not a formality: this counts the sale toward revenue and
// tags the customer Paid, so it should only be used once the receipt has
// actually been looked at.
export function VerifyOrderButton({
  conversationId,
  orderId,
  productName,
}: {
  conversationId: string;
  orderId: string;
  productName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <BadgeCheck />
        Mark as paid
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark this order as paid?</DialogTitle>
          <DialogDescription>
            Use this only if you&apos;ve personally checked the receipt for {productName} and confirmed the payment
            yourself. This will mark the order verified, count it toward revenue, and tag the customer &quot;Paid&quot;
            — the same as if the AI had verified it.
          </DialogDescription>
        </DialogHeader>
        <form action={verifyOrderManually}>
          <input type="hidden" name="conversationId" value={conversationId} />
          <input type="hidden" name="orderId" value={orderId} />
          <CloseOnSuccess onDone={() => setOpen(false)} />
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
            <SubmitButton pendingLabel="Verifying…" successMessage="Order marked as paid">
              Mark as paid
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
