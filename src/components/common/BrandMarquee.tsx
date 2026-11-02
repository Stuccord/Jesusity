const PHRASES = [
  "SUPERNATURAL",
  "HEAVYWEIGHT COTTON",
  "LIMITED DROPS",
  "MADE IN ACCRA",
  "ENDLESS PURSUIT",
  "PAY WITH MOMO",
];

export function BrandMarquee() {
  // The track holds two identical copies so the -50% loop is seamless.
  const items = [...PHRASES, ...PHRASES];

  return (
    <section className="brand-marquee" aria-label={PHRASES.join(", ")}>
      <div className="brand-marquee-track" aria-hidden="true">
        {items.map((phrase, i) => (
          <span key={i} className={`brand-marquee-item ${i % 2 ? "outlined" : ""}`}>
            {phrase}
            <span className="brand-marquee-star">✦</span>
          </span>
        ))}
      </div>
    </section>
  );
}
