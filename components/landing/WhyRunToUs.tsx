import { BadgeCheck, Gauge, ShieldCheck } from 'lucide-react';

const items = [
  {
    title: 'Price Advantage',
    desc: '$20–200 vs $500+ agencies. Keep your budget running lean.',
    icon: BadgeCheck,
  },
  {
    title: 'Speed Advantage',
    desc: 'Under 30 minutes from idea to first draft. Sprint past the competition.',
    icon: Gauge,
  },
  {
    title: 'Quality Advantage',
    desc: 'AI-orchestrated components curated for pro results. No shortcuts.',
    icon: ShieldCheck,
  },
];

export function WhyRunToUs() {
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-background to-muted/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wide">Why people run to us</p>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3">Price. Quality. Speed. No compromises.</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            People are constantly running after better solutions — they run here because we deliver all three without
            the usual trade-offs.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


