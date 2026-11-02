import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MESSAGES = [
  "Free delivery in Accra over GH₵500",
  "Pay with MoMo or card",
  "Delivery across Ghana",
];

const INTERVAL_MS = 4500;

export function AnnouncementBar() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const step = useCallback((dir: 1 | -1) => {
    setIndex((i) => (i + dir + MESSAGES.length) % MESSAGES.length);
  }, []);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => step(1), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused, step, index]);

  return (
    <div
      className="promo-bar"
      role="region"
      aria-label="Announcements"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <button type="button" className="promo-arrow" onClick={() => step(-1)} aria-label="Previous announcement">
        <ChevronLeft size={16} />
      </button>
      <div className="promo-viewport" aria-live="polite">
        {MESSAGES.map((message, i) => (
          <p key={message} className={`promo-message ${i === index ? "is-active" : ""}`} aria-hidden={i !== index}>
            {message}
          </p>
        ))}
      </div>
      <button type="button" className="promo-arrow" onClick={() => step(1)} aria-label="Next announcement">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
