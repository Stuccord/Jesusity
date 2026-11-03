import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, HelpCircle } from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ | Jesusity" },
      {
        name: "description",
        content:
          "Answers to common questions regarding Jesusity sizing, Mobile Money payments, shipping in Accra, and returns.",
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
        a: "Payments are processed securely by Paystack. You can pay with Mobile Money (MTN MoMo, Telecel Cash, AirtelTigo Money) by approving a prompt on your phone, or with a Visa or Mastercard debit/credit card.",
      },
      {
        q: "Can I cancel or modify my order after placing it?",
        a: "Contact us as soon as possible with your order reference. We can change or cancel orders that haven't been dispatched yet.",
      },
      {
        q: "Do you offer cash on delivery (COD)?",
        a: "Not at the moment. All orders are paid online with Mobile Money or card before dispatch, which reserves your size.",
      },
    ],
  },
  {
    category: "DELIVERY & DISPATCH",
    questions: [
      {
        q: "How fast is delivery?",
        a: "Delivery in Accra takes 1–2 business days; other regions take 2–5 business days. Orders of GH₵500 or more ship free; otherwise delivery is GH₵35. You can follow your order on the Track Order page using your order reference.",
      },
      {
        q: "Do you ship nationwide across Ghana?",
        a: "Yes, we deliver to all 16 regions of Ghana.",
      },
      {
        q: "Is international delivery available?",
        a: "Not yet. We currently deliver within Ghana only.",
      },
    ],
  },
  {
    category: "SIZING & GARMENT CARE",
    questions: [
      {
        q: "How do Jesusity garments fit?",
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
          <HelpCircle size={28} className="text-[#111111]" />
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
