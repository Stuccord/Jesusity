import { useState } from "react";
import { X } from "lucide-react";

const MESSAGES = [
  "Free delivery in Accra over GH₵500",
  "Pay with MoMo or card",
  "Delivery across Ghana",
];

export function AnnouncementBar() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  // Each group is repeated so it fills wide screens; the track holds two identical
  // halves so translating by -50% loops seamlessly.
  const group = [...MESSAGES, ...MESSAGES];

  return (
    <div className="announcement-bar" role="region" aria-label="Announcement">
      <span className="sr-only">{MESSAGES.join(". ")}</span>
      <div className="announcement-ticker" aria-hidden="true">
        <div className="announcement-track">
          {[0, 1].map((half) => (
            <div key={half} className="announcement-group">
              {group.map((message, i) => (
                <span key={i} className="announcement-item">
                  {message}
                  <span className="announcement-sep">•</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
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
