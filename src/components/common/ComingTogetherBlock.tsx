import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";

interface ComingTogetherBlockProps {
  title?: string;
  subtitle?: string;
  primaryActionText?: string;
  primaryActionHref?: string;
  secondaryActionText?: string;
  secondaryActionHref?: string;
}

export function ComingTogetherBlock({
  title = "Curating Next Chapter",
  subtitle = "Our atelier is preparing this experience. Discover available archival pieces and latest releases in the meantime.",
  primaryActionText = "Explore Collection",
  primaryActionHref = "/shop",
  secondaryActionText = "View Lookbook",
  secondaryActionHref = "/lookbook",
}: ComingTogetherBlockProps) {
  return (
    <div className="coming-together-card">
      <div className="coming-together-badge">
        <Sparkles size={13} className="text-[#ffffff]" />
        <span>COMING TOGETHER</span>
      </div>
      <h2 className="coming-together-heading">{title}</h2>
      <p className="coming-together-subtext">{subtitle}</p>
      <div className="coming-together-actions">
        {primaryActionHref.startsWith("/") ? (
          <Link to={primaryActionHref} className="coming-together-btn-primary">
            {primaryActionText} <ArrowRight size={15} />
          </Link>
        ) : (
          <a href={primaryActionHref} className="coming-together-btn-primary">
            {primaryActionText} <ArrowRight size={15} />
          </a>
        )}
        {secondaryActionHref.startsWith("/") ? (
          <Link to={secondaryActionHref} className="coming-together-btn-secondary">
            {secondaryActionText}
          </Link>
        ) : (
          <a href={secondaryActionHref} className="coming-together-btn-secondary">
            {secondaryActionText}
          </a>
        )}
      </div>
    </div>
  );
}
