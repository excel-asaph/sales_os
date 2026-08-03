import { ExternalLink } from "lucide-react";

export function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

export function ReferralDetails({ referral }: { referral: Record<string, string | undefined> }) {
  return (
    <div className="flex flex-col gap-3 text-sm">
      <Field label="Type" value={referral.source_type ?? "—"} />
      <Field label="Ad/post headline" value={referral.headline ?? "—"} />
      <Field label="Ad/post body" value={referral.body ?? "—"} />
      {referral.source_url && (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Source</span>
          <a
            href={referral.source_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 truncate font-medium underline"
          >
            {referral.source_url} <ExternalLink className="size-3 shrink-0" />
          </a>
        </div>
      )}
    </div>
  );
}
