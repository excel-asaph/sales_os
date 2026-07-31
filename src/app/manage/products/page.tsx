import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DashboardNav } from "@/components/DashboardNav";
import { createProduct, toggleProductAvailable, deleteProduct } from "./actions";

export default async function ProductsPage() {
  const session = await getSession();
  if (!session?.isAdmin) return null;

  const products = await prisma.product.findMany({
    where: { businessId: session.businessId },
    orderBy: { name: "asc" },
  });

  return (
    <main style={{ padding: 32, fontFamily: "sans-serif", maxWidth: 700, margin: "0 auto" }}>
      <DashboardNav isAdmin={session.isAdmin} />
      <h1>Products</h1>

      {products.length === 0 ? (
        <p style={{ color: "#666" }}>No products yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th style={{ padding: "6px 8px" }}>Name</th>
              <th style={{ padding: "6px 8px" }}>Price</th>
              <th style={{ padding: "6px 8px" }}>Category</th>
              <th style={{ padding: "6px 8px" }}>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "6px 8px" }}>{product.name}</td>
                <td style={{ padding: "6px 8px" }}>
                  {product.currency} {product.price.toString()}
                </td>
                <td style={{ padding: "6px 8px" }}>{product.category ?? "—"}</td>
                <td style={{ padding: "6px 8px" }}>{product.available ? "Available" : "Unavailable"}</td>
                <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>
                  <form action={toggleProductAvailable} style={{ display: "inline" }}>
                    <input type="hidden" name="productId" value={product.id} />
                    <button type="submit" style={{ marginRight: 8 }}>
                      {product.available ? "Mark unavailable" : "Mark available"}
                    </button>
                  </form>
                  <form action={deleteProduct} style={{ display: "inline" }}>
                    <input type="hidden" name="productId" value={product.id} />
                    <button type="submit">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Add a product</h2>
      <form action={createProduct}>
        <label style={{ display: "block", marginBottom: 8 }}>
          Name
          <input type="text" name="name" required style={{ display: "block", width: "100%", padding: 6 }} />
        </label>
        <label style={{ display: "block", marginBottom: 8 }}>
          Description
          <textarea name="description" rows={2} style={{ display: "block", width: "100%", padding: 6 }} />
        </label>
        <label style={{ display: "block", marginBottom: 8 }}>
          Price (NGN)
          <input
            type="number"
            name="price"
            required
            min={0}
            step="0.01"
            style={{ display: "block", width: "100%", padding: 6 }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 8 }}>
          File URL (where the product itself lives, sent to customers on delivery)
          <input type="text" name="fileUrl" style={{ display: "block", width: "100%", padding: 6 }} />
        </label>
        <label style={{ display: "block", marginBottom: 12 }}>
          Category
          <input type="text" name="category" style={{ display: "block", width: "100%", padding: 6 }} />
        </label>
        <button type="submit" style={{ padding: "8px 16px" }}>
          Add product
        </button>
      </form>
    </main>
  );
}
