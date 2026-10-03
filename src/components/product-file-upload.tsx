"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

// Uploads a product's PDF to src/app/api/products/[id]/file, which stores it
// and pulls its text out for the AI. A plain fetch rather than a Server
// Action: see that route for why.
export function ProductFileUpload({ productId, hasFile }: { productId: string; hasFile: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch(`/api/products/${productId}/file`, { method: "POST", body });
      const result = await response.json().catch(() => ({ error: "The upload failed. Please try again." }));
      if (!response.ok) {
        toast.error(result.error ?? "The upload failed. Please try again.");
        return;
      }
      toast.success(`Uploaded: ${result.pages} pages, ${result.words.toLocaleString()} words the AI can read.`);
      // Same threshold as the old extraction script's warning.
      if (result.emptyPages > 2) {
        toast.warning(
          `${result.emptyPages} pages have almost no text, probably pictures or tables saved as images. The AI can't read those.`,
          { duration: 10000 }
        );
      }
      router.refresh();
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <Button type="button" variant={hasFile ? "outline" : "default"} disabled={uploading} onClick={() => input.current?.click()}>
        {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
        {uploading ? "Uploading and reading the PDF…" : hasFile ? "Upload a new version" : "Upload the PDF"}
      </Button>
    </>
  );
}
