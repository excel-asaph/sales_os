"use client";

import { cloneElement, createContext, isValidElement, useContext, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

// Two separate places need to open the same Sheet — the header's "Details"
// button and a "View full details" link inside a clamped StatusBanner — so
// its open state has to be lifted above both, unlike a normal
// Sheet/SheetTrigger pair (e.g. AppShell's notification bell) where the
// trigger and the content are declared right next to each other. Provider
// wraps the whole page; Trigger and Panel below just read/write the same
// shared state from wherever they're rendered.
const DetailsSheetContext = createContext<{ open: boolean; setOpen: (open: boolean) => void } | null>(null);

function useDetailsSheetContext() {
  const ctx = useContext(DetailsSheetContext);
  if (!ctx) throw new Error("Must be used within <MobileDetailsSheetProvider>");
  return ctx;
}

export function MobileDetailsSheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <DetailsSheetContext.Provider value={{ open, setOpen }}>{children}</DetailsSheetContext.Provider>;
}

// Matches the `render` prop convention already used everywhere else in
// this codebase (DialogTrigger, SheetTrigger, Button) instead of a
// one-off children/className API — pass whatever element should be
// clickable (a Button in the header, a plain text link in the banner) and
// this just wires an onClick onto it.
export function MobileDetailsSheetTrigger({ render }: { render: ReactElement<{ onClick?: () => void }> }) {
  const { setOpen } = useDetailsSheetContext();
  if (!isValidElement(render)) return null;
  return cloneElement(render, { onClick: () => setOpen(true) });
}

export function MobileDetailsSheetPanel({ children }: { children: ReactNode }) {
  const { open, setOpen } = useDetailsSheetContext();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Conversation details</SheetTitle>
          <SheetDescription>Record, remembered facts, and orders for this conversation</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
