interface EditorialPageHeaderProps {
  eyebrow: string
  title: string
  introduction: string
}

export function EditorialPageHeader({ eyebrow, title, introduction }: EditorialPageHeaderProps) {
  return (
    <header className="grid gap-8 border-b border-ink/15 pb-14 md:grid-cols-[1.8fr_1fr] md:items-end md:pb-20">
      <div>
        <p className="section-label mb-5">{eyebrow}</p>
        <h1 className="max-w-5xl font-serif text-[clamp(4.25rem,10vw,9rem)] leading-[0.8] tracking-[-0.05em]">{title}</h1>
      </div>
      <p className="max-w-md text-base leading-relaxed text-ink/60 md:justify-self-end">{introduction}</p>
    </header>
  )
}
