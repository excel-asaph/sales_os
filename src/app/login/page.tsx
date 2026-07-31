import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/dashboard";
  const hasError = params.error === "1";

  return (
    <main
      style={{
        padding: 32,
        fontFamily: "sans-serif",
        maxWidth: 360,
        margin: "80px auto",
      }}
    >
      <h1>Antflow Sales OS</h1>
      <p style={{ color: "#666" }}>Sign in to continue.</p>

      {hasError && (
        <p style={{ color: "#b91c1c", fontSize: 14 }}>
          Incorrect login or password.
        </p>
      )}

      <form action={login}>
        <input type="hidden" name="next" value={next} />
        <label style={{ display: "block", marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>Login</div>
          <input
            type="text"
            name="contact"
            required
            style={{ width: "100%", padding: 8, fontSize: 14 }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>Password</div>
          <input
            type="password"
            name="password"
            required
            style={{ width: "100%", padding: 8, fontSize: 14 }}
          />
        </label>
        <button type="submit" style={{ width: "100%", padding: "8px 16px" }}>
          Sign in
        </button>
      </form>
    </main>
  );
}
