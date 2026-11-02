import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, HelpCircle } from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ | Supernatural Apparel" },
      {
        name: "description",
        content:
          "Answers to common questions regarding Supernatural sizing, Mobile Money payments, shipping in Accra, and returns.",
      },
    ],
  }),
  component: FAQPage,
});

const FAQ_ITEMS = [
  {
    category: "ORDERS & PAYMENT",
    questions: [
      {
        q: "What payment methods are supported?",
        a: "We support instant Mobile Money (MTN MoMo, Telecel Cash, AT Money) via automated prompt on your mobile phone, as well as Visa, Mastercard, and international debit/credit cards with 3D Secure authentication.",
      },
      {
        q: "Can I cancel or modify my order after placing it?",
        a: "Because all pieces are prepared for dispatch rapidly from our Accra fulfillment studio, modifications must be requested within 1 hour of placing the order via our Contact concierge or WhatsApp.",
      },
      {
        q: "Do you offer cash on delivery (COD)?",
        a: "To ensure safety and reservation of limited capsule pieces, all orders must be secured online via Mobile Money or Card prior to rider dispatch.",
      },
    ],
  },
  {
    category: "DELIVERY & DISPATCH",
    questions: [
      {
        q: "How fast is delivery in Accra?",
        a: "Orders placed before 1:00 PM are dispatched same-day via express motorbike courier. All other orders arrive next business day. Orders over GH₵500 receive free doorstep delivery in Accra.",
      },
      {
        q: "Do you ship nationwide across Ghana?",
        a: "Yes. For Kumasi, Takoradi, Tamale, and other regional cities, packages are dispatched via VIP / FedEx parcel services and typically arrive within 2–3 business days.",
      },
      {
        q: "Is international delivery available?",
        a: "Yes, we ship globally via DHL Express. International transit times typically range from 3 to 6 business days.",
      },
    ],
  },
  {
    category: "SIZING & GARMENT CARE",
    questions: [
      {
        q: "How do Supernatural garments fit?",
        a: "All our tees are designed with an architectural relaxed drape and structured drop shoulders. If you prefer a tailored standard fit, you can size down. For the signature relaxed streetwear look, select your true size.",
      },
      {
        q: "What does 280 GSM mean?",
        a: "GSM stands for Grams per Square Meter. Standard t-shirts range from 140–180 GSM. Our tees are 280 GSM (ultra-heavy luxury jersey), offering substantial weight, structure, and durability.",
      },
      {
        q: "How should I wash and care for the garments?",
        a: "Machine wash cold inside-out on gentle cycle with similar dark colors. Hang dry or flat dry in shade. Do not iron directly on graphic prints or high-density embroidery.",
      },
    ],
  },
];

function FAQPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "ORDERS & PAYMENT-0": true,
    "DELIVERY & DISPATCH-0": true,
  });

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="faq-page-container">
      <PageHeader
        eyebrow="CLIENT KNOWLEDGE BASE"
        title="FREQUENTLY ASKED"
        subcopy="Everything you need to know about purchasing, shipping, sizing, and policies."
      />

      <div className="faq-content-section">
        {FAQ_ITEMS.map((group) => (
          <div key={group.category} className="faq-group">
            <h2 className="faq-group-title">{group.category}</h2>

            <div className="faq-accordion-list">
              {group.questions.map((item, idx) => {
                const key = `${group.category}-${idx}`;
                const isOpen = Boolean(openItems[key]);

                return (
                  <div key={item.q} className={`faq-accordion-item ${isOpen ? "open" : ""}`}>
                    <button
                      type="button"
                      className="faq-question-btn"
                      onClick={() => toggleItem(key)}
                      aria-expanded={isOpen}
                    >
                      <span>{item.q}</span>
                      <ChevronDown size={18} className={`faq-chevron ${isOpen ? "rotated" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="faq-answer-panel">
                        <p>{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="faq-bottom-help">
          <HelpCircle size={28} className="text-[#C9A24B]" />
          <h3>STILL HAVE QUESTIONS?</h3>
          <p>
            Our client service team is standing by to assist with custom inquiries and fit advice.
          </p>
          <Link to="/contact" className="faq-contact-btn">
            CONTACT CONCIERGE
          </Link>
        </div>
      </div>
    </div>
  );
}
