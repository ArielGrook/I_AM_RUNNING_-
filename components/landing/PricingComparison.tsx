const rows = [
  { label: 'Delivery time', ours: '< 30 minutes (draft)', theirs: '2-4 weeks' },
  { label: 'Cost', ours: '$20–200', theirs: '$500+' },
  { label: 'AI orchestration', ours: 'Built-in', theirs: 'Rare' },
  { label: 'Component system', ours: '20 styles / 49 tags', theirs: 'Often ad-hoc' },
  { label: 'Export options', ours: 'Yes (planned)', theirs: 'Varies' },
];

export function PricingComparison() {
  return (
    <section className="py-16 sm:py-20 bg-muted/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-primary uppercase tracking-wide">Pricing that makes sense</p>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2">Run faster, spend less</h2>
          <p className="text-muted-foreground mt-2">
            Keep budgets lean without sacrificing quality. Our triple advantage wins the race.
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="grid grid-cols-3 bg-muted text-sm font-semibold">
            <div className="px-4 py-3 text-left">Criteria</div>
            <div className="px-4 py-3 text-left text-primary">I AM RUNNING</div>
            <div className="px-4 py-3 text-left">Typical agency</div>
          </div>
          <div className="divide-y">
            {rows.map((row) => (
              <div key={row.label} className="grid grid-cols-3 px-4 py-3 text-sm">
                <div className="font-medium">{row.label}</div>
                <div className="text-primary font-semibold">{row.ours}</div>
                <div className="text-muted-foreground">{row.theirs}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


