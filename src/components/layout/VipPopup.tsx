import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { ChevronDown, X } from "lucide-react";
import { STORE } from "../../config/store";
import { DEFAULT_COUNTRY, DIAL_COUNTRIES } from "../../config/countries";
import { joinVip, normalizePhone } from "../../lib/vip";
import { OPEN_VIP_EVENT } from "./vipPopupEvents";

const STORAGE_KEY = "jesusity_vip";
const SHOW_AFTER_MS = 1000;
const DISMISS_DAYS = 7;
// Don't interrupt people who are already paying
const HIDDEN_ON = ["/checkout", "/cart", "/order-confirmed"];

function shouldShow(): boolean {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as
      | { joined?: boolean; dismissedAt?: number }
      | null;
    if (saved?.joined) return false;
    if (saved?.dismissedAt && Date.now() - saved.dismissedAt < DISMISS_DAYS * 86_400_000) return false;
    return true;
  } catch {
    return true;
  }
}

function remember(value: { joined: true } | { dismissedAt: number }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Private mode: the pop-up may show again next visit, which is fine
  }
}

export function VipPopup() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hidden = HIDDEN_ON.some((p) => pathname.startsWith(p));
  const [isOpen, setIsOpen] = useState(false);
  // Opened on purpose (not the automatic timer), so show it on any page
  const [requested, setRequested] = useState(false);
  const [countryIso, setCountryIso] = useState(DEFAULT_COUNTRY.iso);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "joined">("idle");
  const [error, setError] = useState<string | null>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const country = DIAL_COUNTRIES.find((c) => c.iso === countryIso) ?? DEFAULT_COUNTRY;
  const fullPhone = normalizePhone(phone, country.dial);

  useEffect(() => {
    if (hidden || isOpen || !shouldShow()) return;
    const timer = window.setTimeout(() => setIsOpen(true), SHOW_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [hidden, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    phoneRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    const open = () => {
      setRequested(true);
      setIsOpen(true);
    };
    window.addEventListener(OPEN_VIP_EVENT, open);
    return () => window.removeEventListener(OPEN_VIP_EVENT, open);
  }, []);

  const close = () => {
    if (status !== "joined") remember({ dismissedAt: Date.now() });
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    if (!fullPhone) {
      setError(`Enter a valid phone number for ${country.name}.`);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setStatus("sending");
    setError(null);
    try {
      const result = await joinVip({
        data: { phone, dial: country.dial, email: email.trim(), website: website || undefined },
      });
      if (!result.ok) {
        setError(result.error);
        setStatus("idle");
        return;
      }
      remember({ joined: true });
      setStatus("joined");
    } catch {
      setError("Please check your number and email, then try again.");
      setStatus("idle");
    }
  };

  if (!isOpen || (hidden && !requested)) return null;

  return (
    <div className="vip-backdrop" onClick={close}>
      <div
        className="vip-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vip-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="vip-close" onClick={close} aria-label="Close">
          <X size={20} />
        </button>

        <p className="vip-eyebrow">THE VIP LIST</p>
        {status === "joined" ? (
          <>
            <h2 id="vip-title" className="vip-title">YOU'RE IN.</h2>
            <p className="vip-copy">
              Check out with <strong>{fullPhone}</strong> and{" "}
              {STORE.vipDiscountPercent}% comes off your first order automatically.
            </p>
            <button type="button" className="vip-submit" onClick={() => setIsOpen(false)}>
              START SHOPPING
            </button>
          </>
        ) : (
          <>
            <h2 id="vip-title" className="vip-title">
              GET {STORE.vipDiscountPercent}% OFF
            </h2>
            <p className="vip-copy">
              Join the VIP list for {STORE.vipDiscountPercent}% off your first order, plus first
              word on new drops.
            </p>
            <form onSubmit={handleSubmit} className="vip-form" noValidate>
              <label htmlFor="vip-phone">Phone number *</label>
              <div className="vip-phone-row">
                <div className="vip-country">
                  <span className="vip-country-value" aria-hidden="true">
                    {country.iso} +{country.dial}
                    <ChevronDown size={14} />
                  </span>
                  <select
                    aria-label="Country code"
                    value={countryIso}
                    onChange={(e) => setCountryIso(e.target.value)}
                  >
                    {DIAL_COUNTRIES.map((c) => (
                      <option key={c.iso} value={c.iso}>
                        {c.name} (+{c.dial})
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  ref={phoneRef}
                  id="vip-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  required
                  placeholder={country.iso === DEFAULT_COUNTRY.iso ? "024 123 4567" : "Phone number"}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <label htmlFor="vip-email">Email *</label>
              <input
                id="vip-email"
                type="email"
                autoComplete="email"
                required
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                className="vip-honeypot"
                aria-hidden="true"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
              {error && (
                <p className="vip-error" role="alert">
                  {error}
                </p>
              )}
              <button type="submit" className="vip-submit" disabled={status === "sending"}>
                {status === "sending" ? "JOINING..." : "JOIN THE VIP LIST"}
              </button>
            </form>
            <button type="button" className="vip-decline" onClick={close}>
              No thanks
            </button>
          </>
        )}
      </div>
    </div>
  );
}
