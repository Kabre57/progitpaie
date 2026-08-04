export function ProvisionPageSkeleton() {
  return <div aria-label="Chargement des provisions" role="status" className="animate-pulse space-y-6">
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {[0, 1, 2].map((item) => <div key={item} className="h-24 rounded-xl bg-[var(--neu-surface-light)]" />)}
    </div>
    <div className="h-16 rounded-xl bg-[var(--neu-surface-light)]" />
    <div className="space-y-3 rounded-xl bg-[var(--neu-surface)] p-4">
      <div className="h-10 rounded bg-[var(--neu-surface-light)]" />
      {Array.from({ length: 8 }, (_, index) => <div key={index} className="h-9 rounded bg-[var(--neu-surface-light)]" />)}
    </div>
    <span className="sr-only">Chargement…</span>
  </div>;
}
