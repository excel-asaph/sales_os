"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Paperclip } from "lucide-react";
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
import { sendProductAsHuman } from "@/app/dashboard/[id]/actions";

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

// The composer's attachment button — same idea as WhatsApp's own paperclip,
// scoped to the one thing a human actually needs to attach here: the
// product file itself, for whenever the AI can't reach send_product (a
// human-owned conversation) or a human just wants to hand it over directly.
// Always shown regardless of stage, same as a real chat app's attach button
// isn't hidden depending on conversation state.
export function SendProductButton({
  conversationId,
  products,
}: {
  conversationId: string;
  products: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState(products[0]?.id ?? "");

  if (products.length === 0) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setProductId(products[0]?.id ?? "");
      }}
    >
      <DialogTrigger
        render={<Button type="button" variant="outline" size="icon-sm" aria-label="Attach a product file" />}
      >
        <Paperclip />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send a product file to the customer?</DialogTitle>
          <DialogDescription>
            This sends the file directly over WhatsApp, the same way the AI would deliver it — useful if the
            original delivery failed, or the customer&apos;s asking for it again.
          </DialogDescription>
        </DialogHeader>
        <form action={sendProductAsHuman} className="flex flex-col gap-3">
          <input type="hidden" name="conversationId" value={conversationId} />
          <CloseOnSuccess onDone={() => setOpen(false)} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sendProductId" className="text-sm font-medium">
              Product
            </label>
            <select
              id="sendProductId"
              name="productId"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
            <SubmitButton pendingLabel="Sending…" successMessage="File sent">
              Send file
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
