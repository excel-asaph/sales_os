// Serializes processing per customer so two inbound messages arriving close
// together (a customer sending two messages back to back, or a WhatsApp
// webhook redelivery landing while the original is still mid-flight) can
// never run two concurrent AI Employee Runtime turns on the same
// conversation. Without this, both turns read the same "not yet verified"
// state, both act on it, and both win — this is exactly what produced 3
// duplicate VERIFIED orders for one real payment in production (see
// ingest-message.ts).
//
// In-process only, keyed by customerId — sufficient because this is a
// single-instance deployment (Railway, one sales_os service; same
// reasoning as src/app/login/actions.ts's in-memory lockout). Revisit with
// a cross-instance lock (e.g. a Postgres advisory lock) if this ever runs
// on more than one instance.
const customerLocks = new Map<string, Promise<void>>();

export async function withCustomerLock<T>(customerId: string, fn: () => Promise<T>): Promise<T> {
  const prior = customerLocks.get(customerId) ?? Promise.resolve();

  let releaseNext: () => void;
  const gate = new Promise<void>((resolve) => {
    releaseNext = resolve;
  });
  customerLocks.set(customerId, gate);

  await prior;
  try {
    return await fn();
  } finally {
    releaseNext!();
    // Only the last-in-line caller cleans up, so the map doesn't grow
    // unbounded for customers who stop messaging — an earlier caller
    // finishing first would delete an entry a later caller still needs.
    if (customerLocks.get(customerId) === gate) {
      customerLocks.delete(customerId);
    }
  }
}
