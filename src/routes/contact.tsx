import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us | Supernatural Apparel" },
      {
        name: "description",
        content:
          "Get in touch with the Supernatural concierge team for order inquiries, bespoke requests, and showroom appointments in Accra.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "Order Inquiry",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", subject: "Order Inquiry", message: "" });
    }, 4000);
  };

  return (
    <div className="contact-page-container">
      <PageHeader
        eyebrow="CLIENT CONCIERGE"
        title="GET IN TOUCH"
        subcopy="Direct inquiries, showroom fittings, and order assistance from our Accra atelier."
      />

      <div className="contact-grid">
        {/* Left Column: Direct Info Cards */}
        <div className="contact-info-cards">
          <div className="contact-info-card">
            <MapPin size={22} className="text-[#ffffff]" />
            <h3>ACCRA ATELIER</h3>
            <p>14 Ring Road Central, Osu / Danquah District</p>
            <p className="contact-subtext">Accra, Greater Accra, Ghana</p>
          </div>

          <div className="contact-info-card">
            <Mail size={22} className="text-[#ffffff]" />
            <h3>ELECTRONIC INQUIRIES</h3>
            <p>concierge@supernaturalapparel.com</p>
            <p className="contact-subtext">Responses dispatched within 4 hours</p>
          </div>

          <div className="contact-info-card">
            <Phone size={22} className="text-[#ffffff]" />
            <h3>DIRECT / WHATSAPP</h3>
            <p>+233 (0) 54 892 0192</p>
            <p className="contact-subtext">Monday – Saturday: 9:00 AM – 7:00 PM GMT</p>
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <div className="contact-form-card">
          <h3>DISPATCH AN INQUIRY</h3>
          <p>Complete the form below and an atelier concierge will follow up promptly.</p>

          {submitted ? (
            <div className="contact-success-box">
              <Check size={28} className="text-[#ffffff]" />
              <h4>MESSAGE TRANSMITTED</h4>
              <p>
                Thank you for reaching out. We have logged your request and will respond via email
                shortly.
              </p>
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
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                >
                  <option value="Order Inquiry">Order Inquiry & Tracking</option>
                  <option value="Sizing Advice">Sizing & Fit Advice</option>
                  <option value="Wholesale / Press">Wholesale, Collabs & Press</option>
                  <option value="Other">General Question</option>
                </select>
              </div>

              <div className="contact-input-field">
                <label htmlFor="contact-message">Message *</label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  placeholder="How can we assist you with Supernatural garments?"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <button type="submit" className="contact-submit-btn">
                TRANSMIT INQUIRY
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
