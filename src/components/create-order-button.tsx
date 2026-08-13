"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { createAndVerifyOrder } from "@/app/dashboard/[id]/actions";

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

interface OrderableProduct {
  id: string;
  name: string;
  price: number;
}

// For a payment the AI never got to check at all — no Order exists yet to
// flip verified (see VerifyOrderButton, which only covers an order the AI
// already tried and flagged/rejected). This creates one from scratch: pick
// which product and amount it was for, and the platform links whatever
// receipt the customer most recently sent and runs the same downstream
// effects — revenue, purchase count, the Paid tag — as an AI verification.
export function CreateOrderButton({
  conversationId,
  products,
}: {
  conversationId: string;
  products: OrderableProduct[];
}) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [amount, setAmount] = useState(products[0]?.price?.toString() ?? "");

  if (products.length === 0) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setProductId(products[0]?.id ?? "");
          setAmount(products[0]?.price?.toString() ?? "");
        }
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <PlusCircle />
        <span className="hidden sm:inline">Record payment</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a payment the AI never checked?</DialogTitle>
          <DialogDescription>
            Only do this once you&apos;ve personally confirmed the payment yourself. This creates a verified order
            for whichever receipt the customer most recently sent, counts it toward revenue, and tags the customer
            &quot;Paid&quot; — the same as if the AI had verified it.
          </DialogDescription>
        </DialogHeader>
        <form action={createAndVerifyOrder} className="flex flex-col gap-3">
          <input type="hidden" name="conversationId" value={conversationId} />
          <CloseOnSuccess onDone={() => setOpen(false)} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="productId" className="text-sm font-medium">
              Product
            </label>
            <select
              id="productId"
              name="productId"
              value={productId}
              onChange={(e) => {
                const next = e.target.value;
                setProductId(next);
                const product = products.find((p) => p.id === next);
                if (product) setAmount(product.price.toString());
              }}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="expectedAmount" className="text-sm font-medium">
              Amount paid (NGN)
            </label>
            <Input
              id="expectedAmount"
              name="expectedAmount"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
            <SubmitButton pendingLabel="Recording…" successMessage="Payment recorded">
              Record payment
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
