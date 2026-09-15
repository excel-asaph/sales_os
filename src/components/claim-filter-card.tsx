import { ShieldCheck, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ClaimFilterSummary } from "@/lib/trends";

/**
 * What the outbound claim filter caught. Permanent rather than temporary
 * scaffolding: once the filter starts blocking, hits land in the human queue
 * and become visible that way, but the *rate* is the early warning for the
 * prompt rule failing now that the product's own text is in the prompt.
 *
 * Baseline to judge against: 4 hits across 719 messages, all of which were the
 * AI refusing to make a claim rather than making one.
 */
export function ClaimFilterCard({
  summary,
  windowDays,
}: {
  summary: ClaimFilterSummary;
  windowDays: number;
}) {
  const clean = summary.total === 0;
  const Icon = clean ? ShieldCheck : ShieldAlert;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon
            className={`size-4 ${clean ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}
            aria-hidden
          />
          Health-claim check
        </CardTitle>
        <CardDescription>
          {summary.enforcing
            ? "Messages containing health-claim wording are withheld and sent to a human."
            : "Watching only. Messages are still sent; nothing is blocked yet."}{" "}
          Last {windowDays} {windowDays === 1 ? "day" : "days"}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {clean ? (
          <p className="text-sm text-muted-foreground">
            Nothing flagged. Outbound messages stayed clear of the wording Meta&apos;s health
            standard names.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              <span className="font-medium tabular-nums">{summary.total}</span>{" "}
              {summary.total === 1 ? "message" : "messages"} flagged
              {summary.enforcing ? " and withheld" : " and sent anyway"}.
            </p>
            <ul className="flex flex-col gap-2.5 border-t pt-3">
              {summary.hits.map((hit, i) => (
                <li key={i} className="text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    {hit.terms.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-400"
                      >
                        {t}
                      </span>
                    ))}
                    <span className="text-xs text-muted-foreground">
                      {hit.at.toLocaleString()}
                    </span>
                    {hit.conversationId && (
                      <Link
                        href={`/dashboard/${hit.conversationId}`}
                        className="text-xs underline underline-offset-2 hover:no-underline"
                      >
                        open
                      </Link>
                    )}
                  </div>
                  {hit.snippet && (
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      &hellip;{hit.snippet}&hellip;
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
