"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CopyField } from "@/components/copy-field";
import { CheckConnection } from "./check-connection";
import type { WhatsAppNumber } from "@/lib/meta-setup";
import {
  submitAccessToken,
  submitAppSecret,
  loadNumbers,
  connectNumbers,
  getWebhookProgress,
  startConnectionOver,
  startAddingNumber,
} from "./actions";

export type WizardStepKey = "token" | "secret" | "number" | "webhook" | "test" | "done";

const ORDER: WizardStepKey[] = ["token", "secret", "number", "webhook", "test", "done"];
const TITLES: Record<Exclude<WizardStepKey, "done">, string> = {
  token: "Copy your permanent access token",
  secret: "Copy your app secret",
  number: "Choose the number",
  webhook: "Point Meta at Antflow",
  test: "Send a test message",
};

// What a pasted value looks like, so the wizard can recognise it on the
// clipboard when the owner comes back from Meta.
const TOKEN_PATTERN = /^EAA[A-Za-z0-9]{60,}$/;
const SECRET_PATTERN = /^[a-f0-9]{32}$/i;

/**
 * When the owner returns to this tab having copied something that looks like
 * what this step needs, paste it for them. Needs the browser's clipboard
 * permission, asked once; if refused, the paste box works as normal.
 */
function useClipboardWhenBack(pattern: RegExp, enabled: boolean, onFound: (text: string) => void) {
  const lastTried = useRef<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const check = () => {
      if (!document.hasFocus() || !navigator.clipboard?.readText) return;
      navigator.clipboard
        .readText()
        .then((text) => {
          const value = text.trim();
          if (pattern.test(value) && value !== lastTried.current) {
            lastTried.current = value;
            onFound(value);
          }
        })
        .catch(() => {});
    };
    window.addEventListener("focus", check);
    return () => window.removeEventListener("focus", check);
  }, [pattern, enabled, onFound]);
}

function MetaLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button variant="outline" size="sm" nativeButton={false} render={<a href={href} target="_blank" rel="noreferrer" />}>
      {children}
      <ExternalLink />
    </Button>
  );
}

function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ol>
  );
}

export function ConnectWizard(props: {
  step: WizardStepKey;
  appId: string | null;
  webhookUrl: string | null;
  verifyToken: string | null;
  localAddress: boolean;
  connectedNumbers: string[];
}) {
  const { step, appId } = props;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    (action: () => Promise<{ ok: boolean; error?: string }>, success?: string) => {
      setError(null);
      startTransition(async () => {
        const result = await action();
        if (!result.ok) setError(result.error ?? "Something went wrong.");
        else {
          if (success) toast.success(success);
          router.refresh();
        }
      });
    },
    [router]
  );

  const current = ORDER.indexOf(step);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Before you start</CardTitle>
          <CardDescription>
            This connects WhatsApp through a Meta App in your own Meta business account, so your number stays in your
            account. Most of it is on Meta&apos;s site; Antflow fills in what it can by itself. At Antflow&apos;s setup
            call we do this with you.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Steps
            items={[
              <>Create a Meta App of type <strong className="text-foreground">Business</strong>, and add the <strong className="text-foreground">WhatsApp</strong> product to it.</>,
              <>Under WhatsApp → API Setup, add your business number and verify it with the code Meta sends.</>,
              <>
                Use a number that will be for sales only: while it&apos;s connected here it can&apos;t also be used in the
                normal WhatsApp Business app.
              </>,
            ]}
          />
          <div>
            <MetaLink href="https://developers.facebook.com/apps/creation/">Create the app on Meta</MetaLink>
          </div>
        </CardContent>
      </Card>

      <ol className="flex flex-wrap gap-2 text-xs">
        {ORDER.slice(0, 5).map((key, i) => (
          <li
            key={key}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${i === current ? "border-primary bg-primary/5 font-medium" : i < current ? "text-muted-foreground" : "text-muted-foreground/60"}`}
          >
            {i < current ? <Check className="size-3" /> : <span>{i + 1}</span>}
            {TITLES[key as Exclude<WizardStepKey, "done">]}
          </li>
        ))}
      </ol>

      {error && <p className="rounded-lg border border-destructive/40 px-4 py-3 text-sm text-destructive">{error}</p>}

      {step === "token" && <TokenStep pending={pending} run={run} />}
      {step === "secret" && <SecretStep appId={appId} pending={pending} run={run} />}
      {step === "number" && <NumberStep pending={pending} run={run} setError={setError} />}
      {step === "webhook" && (
        <WebhookStep appId={appId} webhookUrl={props.webhookUrl} verifyToken={props.verifyToken} localAddress={props.localAddress} />
      )}
      {step === "test" && <TestStep numbers={props.connectedNumbers} />}
      {step === "done" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="size-5 text-primary" /> WhatsApp is connected
            </CardTitle>
            <CardDescription>
              Messages to {props.connectedNumbers.join(", ")} now reach Antflow, and the AI answers them.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button nativeButton={false} render={<Link href="/settings/whatsapp" />}>
              Back to WhatsApp settings
            </Button>
            <Button variant="outline" disabled={pending} onClick={() => run(startAddingNumber)}>
              Connect another number
            </Button>
            <CheckConnection />
          </CardContent>
        </Card>
      )}

      {(step === "secret" || step === "number") && (
        <button
          type="button"
          className="self-start text-xs text-muted-foreground underline underline-offset-4"
          onClick={() => run(async () => (await startConnectionOver(), { ok: true }))}
        >
          Start over with a different token
        </button>
      )}
    </div>
  );
}

type Run = (action: () => Promise<{ ok: boolean; error?: string }>, success?: string) => void;

function TokenStep({ pending, run }: { pending: boolean; run: Run }) {
  const [token, setToken] = useState("");
  const submit = useCallback((value: string) => run(() => submitAccessToken(value), "Token accepted"), [run]);
  useClipboardWhenBack(TOKEN_PATTERN, !pending, (value) => {
    setToken(value);
    submit(value);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>1. {TITLES.token}</CardTitle>
        <CardDescription>
          A token that never expires, from a system user in your Meta business account. Antflow works out your app and
          WhatsApp account from it.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Steps
          items={[
            <>In Business Settings → <strong className="text-foreground">System users</strong>, add a system user with the Admin role (or pick one you have).</>,
            <>Click <strong className="text-foreground">Assign assets</strong>: give it your app, and your WhatsApp account with full control.</>,
            <>
              Click <strong className="text-foreground">Generate new token</strong>, choose your app, set expiry to{" "}
              <strong className="text-foreground">Never</strong>, tick <code>whatsapp_business_messaging</code> and{" "}
              <code>whatsapp_business_management</code>, and copy the token.
            </>,
            <>Come back to this tab. Antflow pastes and checks it for you (your browser may ask to allow this once).</>,
          ]}
        />
        <div>
          <MetaLink href="https://business.facebook.com/settings/system-users">Open System users on Meta</MetaLink>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="token">Access token</Label>
          <Textarea id="token" rows={3} value={token} onChange={(e) => setToken(e.target.value)} placeholder="EAA…" className="font-mono text-xs" />
        </div>
        <Button className="self-start" disabled={pending || !token.trim()} onClick={() => submit(token)}>
          {pending && <Loader2 className="animate-spin" />}
          {pending ? "Checking with Meta…" : "Check token"}
        </Button>
      </CardContent>
    </Card>
  );
}

function SecretStep({ appId, pending, run }: { appId: string | null; pending: boolean; run: Run }) {
  const [secret, setSecret] = useState("");
  const submit = useCallback((value: string) => run(() => submitAppSecret(value), "App secret accepted"), [run]);
  useClipboardWhenBack(SECRET_PATTERN, !pending, (value) => {
    setSecret(value);
    submit(value);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>2. {TITLES.secret}</CardTitle>
        <CardDescription>
          Lets Antflow check that messages really come from Meta. It stays encrypted and is never shown again.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Steps
          items={[
            <>In your app, open App settings → <strong className="text-foreground">Basic</strong>.</>,
            <>Next to <strong className="text-foreground">App secret</strong>, click Show, enter your Facebook password, and copy it.</>,
            <>Come back to this tab.</>,
          ]}
        />
        {appId && (
          <div>
            <MetaLink href={`https://developers.facebook.com/apps/${appId}/settings/basic/`}>Open App settings on Meta</MetaLink>
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="secret">App secret</Label>
          <Input id="secret" value={secret} onChange={(e) => setSecret(e.target.value)} className="font-mono" autoComplete="off" />
        </div>
        <Button className="self-start" disabled={pending || !secret.trim()} onClick={() => submit(secret)}>
          {pending && <Loader2 className="animate-spin" />}
          {pending ? "Checking with Meta…" : "Check app secret"}
        </Button>
      </CardContent>
    </Card>
  );
}

function NumberStep({ pending, run, setError }: { pending: boolean; run: Run; setError: (e: string | null) => void }) {
  const [numbers, setNumbers] = useState<WhatsAppNumber[] | null>(null);
  const [chosen, setChosen] = useState<string[]>([]);
  const [pin, setPin] = useState("");

  useEffect(() => {
    loadNumbers().then((result) => {
      if (!result.ok) setError(result.error);
      else {
        setNumbers(result.numbers);
        if (result.numbers.length === 1) setChosen([result.numbers[0].id]);
      }
    });
  }, [setError]);

  const needsPin = numbers?.some((n) => chosen.includes(n.id) && !n.registered);

  return (
    <Card>
      <CardHeader>
        <CardTitle>3. {TITLES.number}</CardTitle>
        <CardDescription>The numbers in your WhatsApp account. Choose the one(s) Antflow should answer on.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!numbers ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Asking Meta for your numbers…
          </p>
        ) : numbers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No numbers yet. Add one under WhatsApp → API Setup in your app, then reload this page.
          </p>
        ) : (
          numbers.map((number) => (
            <label key={number.id} className="flex items-start gap-3 rounded-lg border p-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-primary"
                checked={chosen.includes(number.id)}
                onChange={(e) => setChosen((c) => (e.target.checked ? [...c, number.id] : c.filter((id) => id !== number.id)))}
              />
              <span className="flex flex-col gap-0.5">
                <span className="font-medium">
                  {number.displayNumber}
                  {number.verifiedName && <span className="font-normal text-muted-foreground"> · {number.verifiedName}</span>}
                </span>
                <span className="text-muted-foreground">
                  {number.wabaName} · {number.registered ? "ready to send" : "needs registering (Antflow does it)"}
                </span>
              </span>
            </label>
          ))
        )}
        {needsPin && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pin">Choose a 6-digit PIN</Label>
            <Input id="pin" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} className="w-32 font-mono" />
            <span className="text-xs text-muted-foreground">
              Meta&apos;s two-step verification PIN for the number. Keep it safe: Meta asks for it if the number is ever
              moved.
            </span>
          </div>
        )}
        <Button className="self-start" disabled={pending || chosen.length === 0} onClick={() => run(() => connectNumbers(chosen, pin), "Number connected")}>
          {pending && <Loader2 className="animate-spin" />}
          {pending ? "Connecting…" : "Connect"}
        </Button>
      </CardContent>
    </Card>
  );
}

/** Polls the connection until `field` turns true, then refreshes the page to the next step. */
function useWaitFor(field: "verified" | "messageArrived") {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(async () => {
      const progress = await getWebhookProgress();
      if (progress[field]) {
        clearInterval(timer);
        router.refresh();
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [field, router]);
}

function WebhookStep(props: { appId: string | null; webhookUrl: string | null; verifyToken: string | null; localAddress: boolean }) {
  useWaitFor("verified");
  return (
    <Card>
      <CardHeader>
        <CardTitle>4. {TITLES.webhook}</CardTitle>
        <CardDescription>
          The one thing Meta only lets you do on its own site: tell your app where to send messages. This page ticks
          itself the moment Meta reaches Antflow.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Steps
          items={[
            <>In your app, open WhatsApp → <strong className="text-foreground">Configuration</strong>, and click Edit next to Webhook.</>,
            <>Paste the two values below into Callback URL and Verify token, then click <strong className="text-foreground">Verify and save</strong>.</>,
            <>Under Webhook fields, click <strong className="text-foreground">Subscribe</strong> next to <code>messages</code>.</>,
            <>
              Switch the app to <strong className="text-foreground">Live</strong> (the switch at the top of the app&apos;s
              page; Meta asks for a privacy policy link first, under App settings → Basic). An app left in Development
              doesn&apos;t receive real customers&apos; messages.
            </>,
          ]}
        />
        {props.appId && (
          <div>
            <MetaLink href={`https://developers.facebook.com/apps/${props.appId}/whatsapp-business/wa-settings/`}>Open WhatsApp Configuration on Meta</MetaLink>
          </div>
        )}
        {props.webhookUrl && <CopyField label="Callback URL" value={props.webhookUrl} />}
        {props.verifyToken && <CopyField label="Verify token" value={props.verifyToken} />}
        {props.localAddress && (
          <p className="text-xs text-destructive">
            This is a local address Meta can&apos;t reach. When testing on this computer, open Antflow through the tunnel
            address (docs/V2_LOCAL_DEV.md) so this shows that address instead.
          </p>
        )}
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Waiting for Meta to check the address…
        </p>
      </CardContent>
    </Card>
  );
}

function TestStep({ numbers }: { numbers: string[] }) {
  useWaitFor("messageArrived");
  return (
    <Card>
      <CardHeader>
        <CardTitle>5. {TITLES.test}</CardTitle>
        <CardDescription>
          <Check className="mr-1 inline size-4 text-primary" />
          Meta reached Antflow. Last check: a real message.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm">
          From your own phone, send any WhatsApp message to <strong>{numbers.join(" or ")}</strong>. The AI will answer
          it like a customer, so try one of your products.
        </p>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Waiting for your message…
        </p>
        <p className="text-xs text-muted-foreground">
          Nothing after a minute? The usual reasons: the app is still in Development mode rather than Live, or{" "}
          <code>messages</code> isn&apos;t subscribed under Webhook fields.
        </p>
      </CardContent>
    </Card>
  );
}
