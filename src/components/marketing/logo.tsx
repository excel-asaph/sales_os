// Antflow's mark (brand direction B, "Colony", chosen 2026-10-04): a chat
// bubble whose "typing…" dots are an ant's body.
export function AntflowMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" aria-hidden="true">
      <path d="M8 12a8 8 0 0 1 8-8h28a8 8 0 0 1 8 8v22a8 8 0 0 1-8 8H24l-12 10v-10h0a4 4 0 0 1-4-4z" fill="#121614" />
      <circle cx="20" cy="23" r="4" fill="#FF6A4D" />
      <circle cx="30" cy="23" r="5" fill="#FF6A4D" />
      <circle cx="41" cy="23" r="6" fill="#FF6A4D" />
    </svg>
  );
}

export function AntflowLogo({ size = 32 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <AntflowMark size={size} />
      <span className="font-(family-name:--font-sora) font-bold tracking-tight" style={{ fontSize: size * 0.72 }}>
        antflow
      </span>
    </span>
  );
}
