"use client";

import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Every Server Action form in this app was submitting with no feedback —
// no spinner while it ran, nothing confirming it actually saved. This is
// the fix, applied uniformly: useFormStatus() (must render inside the
// <form>, which every call site already does) drives the pending spinner,
// and the pending->false transition — genuine completion, not a redirect
// or a thrown error, both of which unmount this component instead — fires
// a toast. No server-side changes needed; purely additive at the UI layer.
export function SubmitButton({
  children,
  pendingLabel,
  successMessage,
  ...props
}: ComponentProps<typeof Button> & {
  pendingLabel?: ReactNode;
  successMessage?: string;
}) {
  const { pending } = useFormStatus();
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && successMessage) {
      toast.success(successMessage);
    }
    wasPending.current = pending;
  }, [pending, successMessage]);

  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending && <Loader2 className="animate-spin" />}
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
