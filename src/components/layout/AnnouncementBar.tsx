import { useState } from "react";
import { X } from "lucide-react";

export function AnnouncementBar() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="announcement-bar" role="region" aria-label="Announcement">
      <span className="announcement-text">
        FREE DELIVERY IN ACCRA OVER GH₵500 • PAY WITH MOMO OR CARD
      </span>
      <button
        type="button"
        className="announcement-dismiss"
        onClick={() => setVisible(false)}
        aria-label="Dismiss announcement"
      >
        <X size={14} />
      </button>
    </div>
  );
}
