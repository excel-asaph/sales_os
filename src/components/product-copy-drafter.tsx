"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProductDraft } from "@/lib/product-draft";
import { draftProductCopyAction, saveProductCopy } from "@/app/manage/products/[id]/actions";

// The AI's draft of a product's sales copy, for the owner to edit and keep
// or drop part by part (src/lib/product-draft.ts). Nothing is saved until
// "Save what's ticked".

function composeDescription(draft: ProductDraft): string {
  return [
    draft.description,
    `Who it's for: ${draft.whoItsFor}`,
    `What's inside:\n${draft.sellingPoints.map((point) => `- ${point}`).join("\n")}`,
  ].join("\n\n");
}

export function ProductCopyDrafter({ productId, hasText }: { productId: string; hasText: boolean }) {
  const router = useRouter();
  const [drafting, startDrafting] = useTransition();
  const [saving, startSaving] = useTransition();
  const [description, setDescription] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ProductDraft["faq"]>([]);
  const [pitch, setPitch] = useState("");
  const [keep, setKeep] = useState({ description: true, questions: true, pitch: true });

  function draft() {
    startDrafting(async () => {
      const result = await draftProductCopyAction(productId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setDescription(composeDescription(result.draft));
      setQuestions(result.draft.faq);
      setPitch(result.draft.pitch);
      setKeep({ description: true, questions: true, pitch: true });
    });
  }

  function save() {
    startSaving(async () => {
      const result = await saveProductCopy(productId, {
        description: keep.description ? (description ?? undefined) : undefined,
        questions: keep.questions ? questions : undefined,
        pitch: keep.pitch ? pitch : undefined,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Saved. The AI uses it from the next conversation.");
      setDescription(null);
      router.refresh();
    });
  }

  if (description === null) {
    return (
      <div className="flex flex-col gap-2">
        <Button className="self-start" variant="outline" disabled={!hasText || drafting} onClick={draft}>
          {drafting ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {drafting ? "Reading the book and drafting… (about 30 seconds)" : "Draft with AI"}
        </Button>
        <span className="text-xs text-muted-foreground">
          {hasText
            ? "Writes a description, likely customer questions with answers, and a WhatsApp pitch from the book itself. You edit and approve it; nothing reaches a customer before you save."
            : "Upload the PDF first: the draft is written from what's inside it."}
        </span>
      </div>
    );
  }

  const tick = (part: keyof typeof keep) => (
    <input
      type="checkbox"
      className="size-4 accent-primary"
      checked={keep[part]}
      onChange={(e) => setKeep((k) => ({ ...k, [part]: e.target.checked }))}
    />
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label className="flex items-center gap-2">
          {tick("description")} Use as the product description
        </Label>
        <Textarea rows={10} value={description} onChange={(e) => setDescription(e.target.value)} disabled={!keep.description} />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="flex items-center gap-2">
          {tick("questions")} Add these questions to the product&apos;s questions
        </Label>
        {questions.map((q, i) => (
          <div key={i} className="flex flex-col gap-1.5 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Input
                value={q.question}
                disabled={!keep.questions}
                onChange={(e) => setQuestions((qs) => qs.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))}
              />
              <Button type="button" variant="ghost" size="icon-sm" disabled={!keep.questions} onClick={() => setQuestions((qs) => qs.filter((_, j) => j !== i))} aria-label="Remove this question">
                <X />
              </Button>
            </div>
            <Textarea
              rows={3}
              value={q.answer}
              disabled={!keep.questions}
              onChange={(e) => setQuestions((qs) => qs.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="flex items-center gap-2">
          {tick("pitch")} Use as this product&apos;s opening message
        </Label>
        <Textarea rows={5} value={pitch} onChange={(e) => setPitch(e.target.value)} disabled={!keep.pitch} />
        <span className="text-xs text-muted-foreground">
          Sent to a new customer who comes for this product. Saved as its pitch script on the Scripts tab below.
        </span>
      </div>

      <div className="flex gap-2">
        <Button disabled={saving || (!keep.description && !keep.questions && !keep.pitch)} onClick={save}>
          {saving && <Loader2 className="animate-spin" />}
          Save what&apos;s ticked
        </Button>
        <Button variant="outline" disabled={saving} onClick={() => setDescription(null)}>
          Discard the draft
        </Button>
      </div>
    </div>
  );
}
