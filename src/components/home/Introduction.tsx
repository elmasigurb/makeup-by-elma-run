interface IntroductionProps {
  heading: string
  text: string
}

export function Introduction({ heading, text }: IntroductionProps) {
  return (
    <section id="about" className="bg-ivory px-5 py-24 sm:px-8 md:py-36 lg:px-12 lg:py-44">
      <div className="mx-auto grid max-w-[1400px] gap-12 md:grid-cols-[1fr_3fr] md:gap-16">
        <p className="section-label">The artist</p>
        <div>
          <h2 className="max-w-5xl font-serif text-5xl leading-[0.98] tracking-[-0.035em] sm:text-6xl lg:text-[5.6rem]">{heading}</h2>
          <p className="mt-10 max-w-3xl whitespace-pre-line text-base leading-relaxed text-ink/70 lg:mt-14">{text}</p>
        </div>
      </div>
    </section>
  )
}
