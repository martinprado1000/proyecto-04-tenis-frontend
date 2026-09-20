export function PageHeader({ eyebrow, title, description }) {
  return (
    <div className="court-lines relative overflow-hidden border-b border-border bg-card/40 px-6 py-8 sm:px-8">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      {eyebrow && (
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
      )}
      <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
      {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}
