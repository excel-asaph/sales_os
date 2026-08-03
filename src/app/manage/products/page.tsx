import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createProduct, toggleProductAvailable, deleteProduct, updateProduct } from "./actions";

export default async function ProductsPage() {
  const session = await getSession();
  if (!session?.isAdmin) return null;

  const products = await prisma.product.findMany({
    where: { businessId: session.businessId },
    orderBy: { name: "asc" },
  });

  return (
    <AppShell active="products" title="Products" description="What the AI can sell">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <Card className="py-0">
          {products.length === 0 ? (
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No products yet.
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      {product.currency} {product.price.toString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{product.category ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={product.available ? "default" : "secondary"}>
                        {product.available ? "Available" : "Unavailable"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger render={<Button variant="outline" size="sm" />}>Edit</DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit product</DialogTitle>
                            </DialogHeader>
                            <form action={updateProduct} className="flex flex-col gap-4">
                              <input type="hidden" name="productId" value={product.id} />
                              <div className="grid gap-4 sm:grid-cols-2">
                                <div className="flex flex-col gap-1.5">
                                  <Label htmlFor={`name-${product.id}`}>Name</Label>
                                  <Input id={`name-${product.id}`} name="name" defaultValue={product.name} required />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <Label htmlFor={`price-${product.id}`}>Price (NGN)</Label>
                                  <Input
                                    id={`price-${product.id}`}
                                    name="price"
                                    type="number"
                                    required
                                    min={0}
                                    step="0.01"
                                    defaultValue={product.price.toString()}
                                  />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <Label htmlFor={`description-${product.id}`}>Description</Label>
                                <Input id={`description-${product.id}`} name="description" defaultValue={product.description ?? ""} />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <Label htmlFor={`fileUrl-${product.id}`}>File URL</Label>
                                <Input id={`fileUrl-${product.id}`} name="fileUrl" defaultValue={product.fileUrl ?? ""} />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <Label htmlFor={`category-${product.id}`}>Category</Label>
                                <Input id={`category-${product.id}`} name="category" defaultValue={product.category ?? ""} />
                              </div>
                              <DialogFooter>
                                <SubmitButton pendingLabel="Saving…" successMessage="Product updated">
                                  Save changes
                                </SubmitButton>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                        <form action={toggleProductAvailable}>
                          <input type="hidden" name="productId" value={product.id} />
                          <SubmitButton
                            variant="outline"
                            size="sm"
                            pendingLabel="Updating…"
                            successMessage={product.available ? "Marked unavailable" : "Marked available"}
                          >
                            {product.available ? "Mark unavailable" : "Mark available"}
                          </SubmitButton>
                        </form>
                        <form action={deleteProduct}>
                          <input type="hidden" name="productId" value={product.id} />
                          <SubmitButton
                            variant="destructive"
                            size="sm"
                            pendingLabel="Deleting…"
                            successMessage="Product deleted"
                          >
                            Delete
                          </SubmitButton>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add a product</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createProduct} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="price">Price (NGN)</Label>
                  <Input id="price" name="price" type="number" required min={0} step="0.01" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fileUrl">File URL</Label>
                <Input id="fileUrl" name="fileUrl" placeholder="Where the product lives, sent to customers on delivery" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" />
              </div>
              <SubmitButton className="self-start" pendingLabel="Adding…" successMessage="Product added">
                Add product
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
