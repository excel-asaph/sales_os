"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

// The one place this app actually needs a copy-to-clipboard field —
// the Connect WhatsApp wizard's guided cross-Business-Manager sharing step
// (src/app/settings/whatsapp), where a value has to be pasted into a
// *different* Business Manager's own UI, not something this app can do
// via an API call. A plain client component since clipboard access is
// inherently client-side; not wired into any Server Action.
export function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded-lg border bg-muted px-3 py-1.5 text-sm">{value}</code>
        <Button type="button" variant="outline" size="icon-sm" onClick={handleCopy}>
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </Button>
      </div>
    </div>
  );
}
