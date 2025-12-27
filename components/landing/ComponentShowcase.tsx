const styles = [
  'modern_dark',
  'modern_light',
  'modern_gradient',
  'classic_white',
  'classic_elegant',
  'minimal_dark',
  'minimal_light',
  'corporate_blue',
  'corporate_gray',
  'creative_colorful',
  'creative_artistic',
  'vintage_retro',
  'tech_neon',
  'medical_clean',
  'restaurant_warm',
  'fashion_elegant',
  'ecommerce_modern',
  'blog_readable',
  'portfolio_showcase',
  'custom_authored',
];

const tags = 49;

export function ComponentShowcase() {
  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-wide">Component showcase</p>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2">A catalog that keeps running</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              20 style variants and 49 curated tags keep your builds consistent and discoverable. Components are ready to
              sprint onto the canvas without breaking the pace.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <div className="font-semibold text-foreground">Styles: {styles.length}</div>
            <div>Tags: {tags}</div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {styles.map((style) => (
            <div key={style} className="rounded-xl border bg-card p-4 shadow-sm text-sm">
              <div className="font-semibold capitalize">{style.replace(/_/g, ' ')}</div>
              <div className="text-muted-foreground text-xs mt-1">Styled to run with any layout.</div>
            </div>
          ))}
          <div className="rounded-xl border bg-primary/5 p-4 shadow-sm text-sm border-primary/30">
            <div className="font-semibold text-primary">+ 49 tags</div>
            <div className="text-primary/80 text-xs mt-1">Smart filtering and AI matching ready.</div>
          </div>
        </div>
      </div>
    </section>
  );
}


