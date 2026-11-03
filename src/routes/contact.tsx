import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Mail, MapPin, Phone } from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { STORE } from "../config/store";
import { CONTACT_SUBJECTS, sendContactMessage } from "../lib/inbound";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us | Jesusity" },
      {
        name: "description",
        content:
          "Get in touch with Jesusity about orders, sizing, delivery and collaborations.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    subject: (typeof CONTACT_SUBJECTS)[number];
    message: string;
    website: string;
  }>({
    name: "",
    email: "",
    subject: "Order Inquiry",
    message: "",
    website: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setError(null);
    try {
      const result = await sendContactMessage({ data: formData });
      if (result.ok) setSubmitted(true);
      else setError(result.error);
    } catch {
      setError("Please check your name, email and message, then try again.");
    } finally {
      setIsSending(false);
    }
  };

  const { email, phone, whatsapp, location, hours } = STORE.contact;

  return (
    <div className="contact-page-container">
      <PageHeader
        eyebrow="CLIENT CONCIERGE"
        title="GET IN TOUCH"
        subcopy="Questions about an order, sizing or delivery? We're here to help."
      />

      <div className="contact-grid">
        {/* Left Column: Direct Info Cards */}
        <div className="contact-info-cards">
          {location && (
            <div className="contact-info-card">
              <MapPin size={22} className="text-[#111111]" />
              <h3>BASED IN</h3>
              <p>{location}</p>
              <p className="contact-subtext">Delivering across Ghana</p>
            </div>
          )}

          {email && (
            <div className="contact-info-card">
              <Mail size={22} className="text-[#111111]" />
              <h3>EMAIL</h3>
              <p>
                <a href={`mailto:${email}`}>{email}</a>
              </p>
              {hours && <p className="contact-subtext">{hours}</p>}
            </div>
          )}

          {(phone || whatsapp) && (
            <div className="contact-info-card">
              <Phone size={22} className="text-[#111111]" />
              <h3>{whatsapp ? "PHONE / WHATSAPP" : "PHONE"}</h3>
              {phone && (
                <p>
                  <a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a>
                </p>
              )}
              {whatsapp && (
                <p>
                  <a
                    href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Chat on WhatsApp
                  </a>
                </p>
              )}
              {hours && <p className="contact-subtext">{hours}</p>}
            </div>
          )}
        </div>

        {/* Right Column: Contact Form */}
        <div className="contact-form-card">
          <h3>SEND US A MESSAGE</h3>
          <p>Fill in the form and we'll reply by email.</p>

          {submitted ? (
            <div className="contact-success-box">
              <Check size={28} className="text-[#111111]" />
              <h4>MESSAGE SENT</h4>
              <p>Thanks for reaching out. We'll reply to {formData.email} as soon as we can.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="contact-input-field">
                <label htmlFor="contact-name">Full Name *</label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="contact-input-field">
                <label htmlFor="contact-email">Email Address *</label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  placeholder="your.email@domain.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="contact-input-field">
                <label htmlFor="contact-subject">Inquiry Subject *</label>
                <select
                  id="contact-subject"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subject: e.target.value as (typeof CONTACT_SUBJECTS)[number],
                    })
                  }
                >
                  {CONTACT_SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              <div className="contact-input-field">
                <label htmlFor="contact-message">Message *</label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  placeholder="How can we help?"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              {/* Spam trap, hidden from people */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }}
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />

              {error && (
                <p className="checkout-error" role="alert">
                  {error}
                </p>
              )}

              <button type="submit" className="contact-submit-btn" disabled={isSending}>
                {isSending ? "SENDING..." : "SEND MESSAGE"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
