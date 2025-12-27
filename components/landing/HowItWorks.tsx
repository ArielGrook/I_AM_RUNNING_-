const steps = [
  { title: 'Describe', detail: 'Tell us what you need. Plain language, no jargon.', accent: '01' },
  { title: 'Generate', detail: 'AI assembles components that fit your style and goal.', accent: '02' },
  { title: 'Customize', detail: 'Drag, drop, and tweak. Ship in under 30 minutes.', accent: '03' },
];

export function HowItWorks() {
  return (
    <section className="py-16 sm:py-20 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-primary uppercase tracking-wide">How it works</p>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3">Run through your build in 3 steps</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div key={step.title} className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="text-primary text-sm font-semibold">{step.accent}</div>
              <h3 className="text-xl font-semibold mt-2 mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


