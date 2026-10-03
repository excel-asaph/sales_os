import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/viewer";
import { getEffectiveConfig } from "@/lib/knowledge";
import { AppShell } from "@/components/app-shell";
import { ProductFileUpload } from "@/components/product-file-upload";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PLAYBOOK_SCHEMA } from "@/lib/playbook-schema";
import { FOLLOWUP_SEQUENCE } from "@/lib/followup-sequence";
import {
  updateProductSetting,
  updateProductScript,
  addProductFaq,
  updateProductFaq,
  deleteProductFaq,
  updateProductOpeningText,
  updateProductChannels,
} from "./actions";

// One product's own sales settings (v2, docs/V2_BUILD_PLAN.md Phase 2).
// Everything here is an override of Settings: left on "Use business
// setting", or left empty, the product sells exactly as the business does.

type Choice = { value: string; label: string; hint?: string };

function SettingCard({
  productId,
  field,
  title,
  description,
  current,
  businessLabel,
  choices,
}: {
  productId: string;
  field: string;
  title: string;
  description: string;
  /** The stored override, or "inherit". */
  current: string;
  /** What the business setting currently is, in words. */
  businessLabel: string;
  choices: Choice[];
}) {
  const options: Choice[] = [
    { value: "inherit", label: "Use business setting", hint: `Currently: ${businessLabel}` },
    ...choices,
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={updateProductSetting} className="flex flex-col gap-5">
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="field" value={field} />
          <RadioGroup name="value" defaultValue={current} className="gap-2">
            {options.map((option) => (
              <Label
                key={option.value}
                className="flex items-start gap-3 rounded-lg border p-3 has-data-checked:border-primary has-data-checked:bg-primary/5"
              >
                <RadioGroupItem value={option.value} className="mt-0.5" />
                <span className="flex flex-col gap-0.5 text-sm font-normal">
                  <span className="font-medium">{option.label}</span>
                  {option.hint && <span className="text-muted-foreground">{option.hint}</span>}
                </span>
              </Label>
            ))}
          </RadioGroup>
          <SubmitButton className="self-start" pendingLabel="Saving…" successMessage={`${title} saved`}>
            Save
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

const asChoice = (value: boolean | number | null | undefined) => (value == null ? "inherit" : String(value));

export default async function ProductSalesSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminPage();
  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: { id, businessId: session.businessId },
    include: { settings: true, faqEntries: { orderBy: { order: "asc" } } },
  });
  if (!product) notFound();

  const [business, channels] = await Promise.all([
    getEffectiveConfig(session.businessId),
    prisma.channel.findMany({
      where: { businessId: session.businessId },
      orderBy: { createdAt: "asc" },
      include: { products: { select: { productId: true } } },
    }),
  ]);
  const soldOn = channels.filter((c) => c.products.some((p) => p.productId === product.id));
  const numberName = (c: (typeof channels)[number]) => c.label ?? c.displayNumber ?? `Number ${c.phoneNumberId}`;
  // wa.me wants the number as digits only, country code first.
  const waLink = (c: (typeof channels)[number]) => {
    const digits = c.displayNumber?.replace(/\D/g, "");
    if (!digits) return null;
    return `https://wa.me/${digits}${product.whatsappOpeningText ? `?text=${encodeURIComponent(product.whatsappOpeningText)}` : ""}`;
  };
  const settings = product.settings;
  const productPlaybook = (settings?.playbook as Record<string, string> | null) ?? {};
  const ownScripts = Object.keys(productPlaybook).length;
  const yesNo = (b: boolean, yes: string, no: string) => (b ? yes : no);

  return (
    <AppShell
      active="products"
      title={`${product.name}: sales settings`}
      description="Anything left on the business setting, or left empty, sells exactly as the business does"
      actions={
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/manage/products" />}>
          All products
        </Button>
      }
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Product file</CardTitle>
            <CardDescription>
              The PDF the AI sends a customer, and whose text it answers questions from after delivery.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            {product.fileUrl ? (
              <div className="flex flex-col gap-1">
                <a href={product.fileUrl} target="_blank" rel="noreferrer" className="w-fit font-medium underline underline-offset-4">
                  Open the current file
                </a>
                <span className="text-muted-foreground">
                  {product.contentText
                    ? `The AI can read ${product.contentText.split(/\s+/).length.toLocaleString()} words of it.`
                    : "The AI has no text from this file, so it can't answer questions from it."}
                </span>
              </div>
            ) : (
              <p className="text-muted-foreground">No file yet. Customers can&apos;t be sent this product until there is one.</p>
            )}
            <div>
              <ProductFileUpload productId={product.id} hasFile={Boolean(product.fileUrl)} />
            </div>
            <p className="text-xs text-muted-foreground">
              PDF only, up to 50 MB. A new version replaces the text the AI reads; customers who already have the old
              one keep it.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>WhatsApp numbers and link</CardTitle>
            <CardDescription>
              Which numbers sell this product, and the link that starts a chat about it. On a number that sells
              several products, the link&apos;s opening message tells the AI which one the customer came for.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 text-sm">
            {channels.length === 0 ? (
              <p className="text-muted-foreground">
                No WhatsApp number is connected yet.{" "}
                <Link href="/settings/whatsapp" className="underline underline-offset-4">
                  Connect one
                </Link>
                .
              </p>
            ) : (
              <form action={updateProductChannels} className="flex flex-col gap-3">
                <input type="hidden" name="productId" value={product.id} />
                <span className="font-medium">Sold on</span>
                {channels.map((channel) => {
                  const others = channel.products.filter((p) => p.productId !== product.id).length;
                  return (
                    <label key={channel.id} className="flex items-start gap-3 rounded-lg border p-3">
                      <input
                        type="checkbox"
                        name="channelId"
                        value={channel.id}
                        defaultChecked={soldOn.includes(channel)}
                        className="mt-0.5 size-4 accent-primary"
                      />
                      <span className="flex flex-col gap-0.5">
                        <span className="font-medium">
                          {numberName(channel)}
                          {channel.status !== "ACTIVE" && <span className="ml-1.5 text-muted-foreground">(disconnected)</span>}
                        </span>
                        <span className="text-muted-foreground">
                          {soldOn.includes(channel)
                            ? others === 0
                              ? "Only this product, so every chat on it is about this product"
                              : `Shared with ${others} other product${others === 1 ? "" : "s"}`
                            : others === 0
                              ? "Sells nothing yet"
                              : `Sells ${others} other product${others === 1 ? "" : "s"}; ticking this makes it shared`}
                        </span>
                      </span>
                    </label>
                  );
                })}
                <SubmitButton size="sm" className="self-start" pendingLabel="Saving…" successMessage="Numbers saved">
                  Save numbers
                </SubmitButton>
              </form>
            )}

            <form action={updateProductOpeningText} className="flex flex-col gap-1.5">
              <input type="hidden" name="productId" value={product.id} />
              <Label htmlFor="whatsappOpeningText">Opening message</Label>
              <Input
                id="whatsappOpeningText"
                name="whatsappOpeningText"
                defaultValue={product.whatsappOpeningText ?? ""}
                placeholder={`e.g. Hi, I want ${product.name}`}
              />
              <span className="text-xs text-muted-foreground">
                What the link types in for the customer. If their first message contains it (capitals and punctuation
                don&apos;t matter), the chat starts on this product. Make it at least a few words long and different from
                your other products&apos;.
              </span>
              <SubmitButton size="sm" className="mt-1.5 self-start" pendingLabel="Saving…" successMessage="Opening message saved">
                Save opening message
              </SubmitButton>
            </form>

            {soldOn.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="font-medium">Links to share</span>
                {soldOn.map((channel) => {
                  const link = waLink(channel);
                  return (
                    <div key={channel.id} className="flex flex-col gap-0.5">
                      <span className="text-muted-foreground">{numberName(channel)}</span>
                      {link ? (
                        <code className="break-all rounded bg-muted px-2 py-1 text-xs select-all">{link}</code>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          The link appears once this number has received its first message.
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* keepMounted: switching tabs mustn't throw away a script half-typed
            in another one. */}
        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">How it sells</TabsTrigger>
            <TabsTrigger value="scripts">Scripts{ownScripts ? ` (${ownScripts} own)` : ""}</TabsTrigger>
            <TabsTrigger value="faq">Questions{product.faqEntries.length ? ` (${product.faqEntries.length})` : ""}</TabsTrigger>
          </TabsList>

          <TabsContent value="general" keepMounted className="mt-6 flex flex-col gap-5">
            <SettingCard
              productId={product.id}
              field="deliverBeforePayment"
              title="Delivery order"
              description="Send this product before payment is confirmed, or wait for a verified payment first."
              current={asChoice(settings?.deliverBeforePayment)}
              businessLabel={yesNo(business.deliverBeforePayment, "deliver first", "wait for payment")}
              choices={[
                { value: "false", label: "Wait for verified payment before delivering" },
                { value: "true", label: "Deliver the product first, then request payment" },
              ]}
            />
            <SettingCard
              productId={product.id}
              field="aiHandlesReceiptIssues"
              title="Payment issues"
              description="When a receipt for this product has a fixable problem, let the AI ask the customer to resend, or pass it straight to a person."
              current={asChoice(settings?.aiHandlesReceiptIssues)}
              businessLabel={yesNo(business.aiHandlesReceiptIssues, "the AI asks them to resend", "straight to a person")}
              choices={[
                { value: "true", label: "The AI asks the customer to resend" },
                { value: "false", label: "Pass it straight to a person" },
              ]}
            />
            <SettingCard
              productId={product.id}
              field="maxFollowups"
              title="Follow-ups"
              description="How many follow-ups to send for this product before giving up on a quiet customer."
              current={asChoice(settings?.maxFollowups)}
              businessLabel={`${business.maxFollowups} follow-up${business.maxFollowups === 1 ? "" : "s"}`}
              choices={FOLLOWUP_SEQUENCE.map((step) => ({
                value: String(step.step),
                label: `${step.step} follow-up${step.step === 1 ? "" : "s"}`,
                hint: step.angle,
              }))}
            />
            <SettingCard
              productId={product.id}
              field="followupsEnabled"
              title="Switch off follow-ups"
              description="Stop follow-ups for this product only. Pausing follow-ups in Settings stops them for every product, whatever is chosen here."
              current={settings?.followupsEnabled === false ? "false" : "inherit"}
              businessLabel={yesNo(business.followupsEnabled, "on", "paused for the whole business")}
              choices={[{ value: "false", label: "Off for this product" }]}
            />
            <SettingCard
              productId={product.id}
              field="productContentEnabled"
              title="Answer from the product itself"
              description="After delivery, let the AI answer questions from this product's own text."
              current={asChoice(settings?.productContentEnabled)}
              businessLabel={yesNo(business.productContentEnabled, "on", "off")}
              choices={[
                { value: "true", label: "On" },
                { value: "false", label: "Off" },
              ]}
            />
          </TabsContent>

          <TabsContent value="scripts" keepMounted className="mt-6 flex flex-col gap-5">
            <p className="text-sm text-muted-foreground">
              Fill in only the scripts this product says differently, such as its own pitch. An empty box uses the
              business&apos;s script, shown in grey. Emptying a box hands that script back to the business.
            </p>
            {PLAYBOOK_SCHEMA.map((field) => {
              const own = productPlaybook[field.key];
              const fallback = business.playbook?.[field.key];
              return (
                <Card key={field.key}>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {field.label}
                      {own && <span className="ml-2 text-xs font-normal text-muted-foreground">this product&apos;s own</span>}
                    </CardTitle>
                    <CardDescription>{field.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form action={updateProductScript} className="flex flex-col gap-3">
                      <input type="hidden" name="productId" value={product.id} />
                      <input type="hidden" name="key" value={field.key} />
                      <Textarea
                        name="value"
                        defaultValue={own ?? ""}
                        rows={7}
                        className="font-mono text-xs"
                        placeholder={
                          fallback?.trim()
                            ? fallback
                            : "Not set for the business either: the AI will compose this moment naturally."
                        }
                      />
                      <SubmitButton size="sm" className="self-start" pendingLabel="Saving…" successMessage={`${field.label} saved`}>
                        Save
                      </SubmitButton>
                    </form>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="faq" keepMounted className="mt-6 flex flex-col gap-5">
            <p className="text-sm text-muted-foreground">
              Questions about this product only. The AI sees these alongside the business-wide questions in{" "}
              <Link href="/settings" className="underline underline-offset-4">
                Settings
              </Link>
              , and only in conversations about this product.
            </p>
            {product.faqEntries.map((entry) => (
              <Card key={entry.id}>
                <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                  <CardTitle className="text-sm">{entry.question}</CardTitle>
                  <form action={deleteProductFaq}>
                    <input type="hidden" name="productId" value={product.id} />
                    <input type="hidden" name="id" value={entry.id} />
                    <SubmitButton variant="destructive" size="sm" pendingLabel="Deleting…" successMessage="Question removed">
                      Delete
                    </SubmitButton>
                  </form>
                </CardHeader>
                <CardContent>
                  <form action={updateProductFaq} className="flex flex-col gap-3">
                    <input type="hidden" name="productId" value={product.id} />
                    <input type="hidden" name="id" value={entry.id} />
                    <Input name="question" defaultValue={entry.question} required />
                    <Textarea name="answer" defaultValue={entry.answer} rows={3} required />
                    <SubmitButton size="sm" className="self-start" pendingLabel="Saving…" successMessage="Question saved">
                      Save
                    </SubmitButton>
                  </form>
                </CardContent>
              </Card>
            ))}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Add a question about {product.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={addProductFaq} className="flex flex-col gap-3">
                  <input type="hidden" name="productId" value={product.id} />
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="faq-question">Question</Label>
                    <Input id="faq-question" name="question" required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="faq-answer">Answer</Label>
                    <Textarea id="faq-answer" name="answer" rows={3} required />
                  </div>
                  <SubmitButton className="self-start" pendingLabel="Adding…" successMessage="Question added">
                    Add question
                  </SubmitButton>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
