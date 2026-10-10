interface BookingCtaProps {
  heading: string
  button: { label: string; href: string }
}

export function BookingCta({ heading, button }: BookingCtaProps) {
  return (
    <section id="contact" className="bg-ink px-5 py-24 text-ivory sm:px-8 md:py-36 lg:px-12">
      <div className="mx-auto max-w-[1400px] text-center">
        <p className="section-label mb-8 text-ivory/60">Now booking</p>
        <h2 className="mx-auto max-w-5xl font-serif text-[clamp(3.8rem,9vw,8.5rem)] leading-[0.88] tracking-[-0.045em]">
          {heading}
        </h2>
        <a
          href={button.href}
          className="mt-12 inline-flex min-h-14 items-center justify-center border border-ivory/50 px-8 text-sm uppercase tracking-[0.18em] transition-colors hover:bg-ivory hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory"
        >
          {button.label}
        </a>
      </div>
    </section>
  )
}
