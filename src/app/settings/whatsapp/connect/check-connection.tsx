"use client";

import { useState, useTransition } from "react";
import { Check, CircleDot, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkConnection, type CheckItem } from "./actions";

// "Check connection": asks Meta, live, whether the business's WhatsApp
// still works end to end (checkConnection in actions.ts).
export function CheckConnection() {
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState<CheckItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run() {
    setError(null);
    startTransition(async () => {
      const result = await checkConnection();
      if (result.ok) setItems(result.items);
      else setError(result.error);
    });
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <Button variant="outline" className="self-start" disabled={pending} onClick={run}>
        {pending && <Loader2 className="animate-spin" />}
        {pending ? "Checking with Meta…" : "Check connection"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {items && (
        <ul className="flex flex-col gap-2 text-sm">
          {items.map((item) => (
            <li key={item.label} className="flex items-start gap-2">
              {item.ok === true ? (
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              ) : item.ok === false ? (
                <X className="mt-0.5 size-4 shrink-0 text-destructive" />
              ) : (
                <CircleDot className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              )}
              <span>
                <span className="font-medium">{item.label}:</span>{" "}
                <span className={item.ok === false ? "text-destructive" : "text-muted-foreground"}>{item.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
