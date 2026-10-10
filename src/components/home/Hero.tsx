interface HeroProps {
  heading: string
  subtitle: string
  imageUrl: string | null
  button: { label: string; href: string }
}

export function Hero({ heading, subtitle, imageUrl, button }: HeroProps) {
  return (
    <section id="top" className="relative min-h-[100svh] overflow-hidden bg-ink text-white">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-[60%_center] md:object-center"
        />
      ) : <div className="absolute inset-0 bg-[#bdbbb6]" aria-hidden="true" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/25" />
      <div className="relative mx-auto flex min-h-[100svh] max-w-[1600px] items-end px-5 pb-12 sm:px-8 md:pb-16 lg:px-12 lg:pb-20">
        <div className="w-full animate-reveal">
          <p className="mb-4 text-xs uppercase tracking-[0.34em] sm:text-sm">{subtitle}</p>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <h1 className="max-w-5xl font-serif text-[clamp(4.7rem,14vw,12rem)] font-normal leading-[0.72] tracking-[-0.055em]">
              {heading}
            </h1>
            <a href={button.href} className="group mb-1 flex w-fit items-center gap-4 text-sm uppercase tracking-[0.18em]">
              <span className="grid size-12 place-items-center rounded-full border border-white/60 transition-colors group-hover:bg-white group-hover:text-ink">
                ↓
              </span>
              {button.label}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
