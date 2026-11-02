import { useEffect, useRef, useState } from "react";
import { type ProductStory } from "../../data/products";

interface ProductStoryBlockProps {
  story?: ProductStory;
}

export function ProductStoryBlock({ story }: ProductStoryBlockProps) {
  const blockRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = blockRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!story) return null;

  return (
    <section ref={blockRef} className="pdp-story-block-section" aria-labelledby="pdp-story-heading">
      <div className="pdp-story-block-container">
        {/* LEFT COLUMN: Eyebrow, Scripture, Title */}
        <div className="pdp-story-left-col">
          <div
            className={`pdp-story-fade-item ${inView ? "in-view" : ""}`}
            style={{ "--story-stagger": "0ms" } as React.CSSProperties}
          >
            <span className="pdp-story-eyebrow">THE STORY</span>
          </div>

          {story.scripture && (
            <div
              className={`pdp-story-fade-item ${inView ? "in-view" : ""}`}
              style={{ "--story-stagger": "80ms" } as React.CSSProperties}
            >
              <span className="pdp-story-scripture">{story.scripture}</span>
            </div>
          )}

          <h2
            id="pdp-story-heading"
            className={`pdp-story-title pdp-story-fade-item ${inView ? "in-view" : ""}`}
            style={{ "--story-stagger": "160ms" } as React.CSSProperties}
          >
            {story.title}
          </h2>
        </div>

        {/* RIGHT COLUMN: Body */}
        <div className="pdp-story-right-col">
          <p
            className={`pdp-story-body pdp-story-fade-item ${inView ? "in-view" : ""}`}
            style={{ "--story-stagger": "240ms" } as React.CSSProperties}
          >
            {story.body}
          </p>
        </div>
      </div>
    </section>
  );
}
