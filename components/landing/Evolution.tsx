const milestones = [
  { title: 'Genesis', detail: 'Inspired by Bolt.ai to democratize site building.' },
  { title: 'Lego System', detail: '20 styles, 49 tags to keep components consistent.' },
  { title: 'AI Orchestration', detail: 'ChatGPT + Claude planning for component matching.' },
  { title: 'Breakthrough', detail: 'Resolved JSON serialization & drag-drop pipeline.' },
];

export function Evolution() {
  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-primary uppercase tracking-wide">The evolution</p>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3">Running forward without stopping</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            A sprint from inspiration to execution. Every milestone keeps us running faster toward effortless web
            development.
          </p>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {milestones.map((m, i) => (
            <div key={m.title} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="text-sm text-primary font-semibold mb-2">Step {i + 1}</div>
              <h3 className="text-lg font-semibold mb-1">{m.title}</h3>
              <p className="text-sm text-muted-foreground">{m.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


