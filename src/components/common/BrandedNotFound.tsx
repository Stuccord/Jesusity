import { Link } from "@tanstack/react-router";
import { ArrowLeft, Home, Sparkles } from "lucide-react";

interface BrandedNotFoundProps {
  title?: string;
  message?: string;
}

export function BrandedNotFound({
  title = "PAGE NOT LOCATED",
  message = "The chapter or garment you are looking for does not exist, has been archived, or was moved to a new route.",
}: BrandedNotFoundProps) {
  return (
    <div className="branded-not-found-container">
      <div className="branded-not-found-card">
        <div className="branded-not-found-badge">
          <Sparkles size={14} className="text-[#C9A24B]" />
          <span>ERROR 404</span>
        </div>
        <h1 className="branded-not-found-title">{title}</h1>
        <p className="branded-not-found-desc">{message}</p>
        <div className="branded-not-found-actions">
          <Link to="/" className="branded-not-found-btn-primary">
            <Home size={16} /> RETURN TO STOREFRONT
          </Link>
          <Link to="/shop" className="branded-not-found-btn-secondary">
            <ArrowLeft size={16} /> EXPLORE GRAPHIC TEES
          </Link>
        </div>
      </div>
    </div>
  );
}
