"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { WhatsAppConnectButton } from "@/components/whatsapp-connect-button";
import { completeEmbeddedSignup } from "./actions";

export function ConnectStep({ alreadyConnected, wabaId }: { alreadyConnected: boolean; wabaId: string | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (alreadyConnected) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
        <CheckCircle2 className="size-4 shrink-0" />
        Connected — WhatsApp Business Account {wabaId}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <WhatsAppConnectButton
        onComplete={(result) => {
          setError(null);
          startTransition(async () => {
            try {
              await completeEmbeddedSignup(result);
              router.refresh();
            } catch (err) {
              setError((err as Error).message);
            }
          });
        }}
      />
      {isPending && <p className="text-sm text-muted-foreground">Finishing setup…</p>}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
