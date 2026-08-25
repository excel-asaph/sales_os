"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    FB?: {
      init: (config: { appId: string; autoLogAppEvents: boolean; xfbml: boolean; version: string }) => void;
      login: (
        callback: (response: { authResponse?: { code?: string } | null; status?: string }) => void,
        options: Record<string, unknown>
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

// Meta's own postMessage payload during Embedded Signup — carries the WABA
// ID and phone number ID as the flow progresses, ahead of (and separately
// from) the `code` FB.login's own callback returns. Field names per Meta's
// Embedded Signup v4 docs (developers.facebook.com/documentation/business-
// messaging/whatsapp/embedded-signup) — worth re-confirming against the
// live dashboard once a real Meta App/config_id exists, since this is the
// one part of this feature that can't be verified without one.
interface EmbeddedSignupMessage {
  type: "WA_EMBEDDED_SIGNUP";
  event: "FINISH" | "CANCEL" | "ERROR";
  data?: { waba_id?: string; phone_number_id?: string };
}

function isEmbeddedSignupMessage(data: unknown): data is EmbeddedSignupMessage {
  return typeof data === "object" && data !== null && (data as { type?: unknown }).type === "WA_EMBEDDED_SIGNUP";
}

/**
 * Step 1 of the Connect WhatsApp wizard (src/app/settings/whatsapp) — the
 * one deliberate exception to this app's all-Server-Actions convention.
 * OAuth popups require client-side JS; there's no way around that, so it's
 * scoped to exactly this button rather than introducing client state more
 * broadly across the app.
 *
 * NEXT_PUBLIC_META_APP_ID and NEXT_PUBLIC_META_EMBEDDED_SIGNUP_CONFIG_ID
 * come from the platform's own Meta App (Meta for Developers → this app →
 * WhatsApp → Embedded Signup) — a one-time manual setup step outside this
 * codebase, documented in docs/META_CONVERSIONS_SETUP.md.
 */
export function WhatsAppConnectButton({
  onComplete,
}: {
  onComplete: (result: { code: string; wabaId?: string; phoneNumberId?: string }) => void;
}) {
  // Lazy initializer, not an effect + setState — the SDK may already be
  // loaded (a prior mount within the same page session), and checking that
  // synchronously at init time is exactly what a lazy initializer is for,
  // versus setting state synchronously inside an effect body.
  const [sdkReady, setSdkReady] = useState(() => typeof window !== "undefined" && Boolean(window.FB));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingSignupData = useRef<{ wabaId?: string; phoneNumberId?: string }>({});
  const appId = process.env.NEXT_PUBLIC_META_APP_ID;

  // SDK loading — separate from the message listener below, and guarded on
  // sdkReady itself, so this genuinely only does anything once per mount
  // (re-running it after sdkReady flips true would be a no-op anyway, but
  // bailing out early keeps the intent obvious).
  useEffect(() => {
    if (!appId || sdkReady) return;

    window.fbAsyncInit = () => {
      window.FB?.init({ appId, autoLogAppEvents: true, xfbml: true, version: "v21.0" });
      setSdkReady(true);
    };

    if (!document.getElementById("facebook-jssdk")) {
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      document.body.appendChild(script);
    }
  }, [appId, sdkReady]);

  // The postMessage listener has to live for the component's whole
  // lifetime, independent of sdkReady — Embedded Signup's FINISH event
  // arrives after a user clicks "Connect" (well after the SDK finished
  // loading), so this can't be tied to the same effect as SDK loading
  // above without losing events the moment sdkReady flips true.
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") return;
      let parsed: unknown;
      try {
        parsed = JSON.parse(event.data);
      } catch {
        return;
      }
      if (!isEmbeddedSignupMessage(parsed)) return;
      if (parsed.event === "FINISH" && parsed.data) {
        pendingSignupData.current = { wabaId: parsed.data.waba_id, phoneNumberId: parsed.data.phone_number_id };
      } else if (parsed.event === "ERROR") {
        setError("Meta reported an error during setup — please try again.");
        setLoading(false);
      } else if (parsed.event === "CANCEL") {
        setLoading(false);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  function handleClick() {
    const configId = process.env.NEXT_PUBLIC_META_EMBEDDED_SIGNUP_CONFIG_ID;
    if (!window.FB || !configId) {
      setError("Embedded Signup isn't configured yet.");
      return;
    }
    setError(null);
    setLoading(true);
    window.FB.login(
      (response) => {
        const code = response.authResponse?.code;
        if (!code) {
          setError("Facebook login didn't complete — nothing was connected.");
          setLoading(false);
          return;
        }
        onComplete({ code, ...pendingSignupData.current });
        setLoading(false);
      },
      {
        config_id: configId,
        response_type: "code",
        override_default_response_type: true,
        extras: { setup: {}, sessionInfoVersion: "3" },
      }
    );
  }

  const displayError = appId ? error : "Meta App is not configured yet (NEXT_PUBLIC_META_APP_ID).";

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleClick} disabled={!appId || !sdkReady || loading} className="w-fit">
        {loading ? <Loader2 className="animate-spin" /> : null}
        {loading ? "Connecting…" : "Connect WhatsApp with Facebook"}
      </Button>
      {displayError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          {displayError}
        </div>
      )}
    </div>
  );
}
