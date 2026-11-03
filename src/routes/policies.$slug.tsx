import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, Truck, RotateCcw, FileText } from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";

const POLICIES: Record<
  string,
  {
    title: string;
    eyebrow: string;
    subcopy: string;
    content: { heading: string; body: string }[];
  }
> = {
  shipping: {
    title: "SHIPPING & DISPATCH",
    eyebrow: "LOGISTICS POLICY",
    subcopy: "How and where we deliver your order.",
    content: [
      {
        heading: "1. Delivery in Accra",
        body: "Orders within Accra and Tema are delivered by courier, usually within 1–2 business days of payment. Orders of GH₵500 or more ship free; otherwise a flat GH₵35 delivery fee applies.",
      },
      {
        heading: "2. Delivery Across Ghana",
        body: "We deliver to all 16 regions of Ghana. Orders outside Greater Accra usually arrive within 2–5 business days. You can check your order's status at any time on the Track Order page with your order reference.",
      },
      {
        heading: "3. International Orders",
        body: "We currently deliver within Ghana only.",
      },
    ],
  },
  returns: {
    title: "RETURNS & EXCHANGES",
    eyebrow: "SATISFACTION PROTOCOL",
    subcopy: "Our terms for garment returns, size exchanges, and quality guarantees.",
    content: [
      {
        heading: "1. Eligibility Window",
        body: "We accept returns for unworn, unwashed garments in pristine condition with original hangtags intact within 14 days of delivery.",
      },
      {
        heading: "2. Size Exchange Process",
        body: "If your item doesn't fit, contact us with your order reference. If your new size is in stock we'll reserve it and arrange the exchange.",
      },
      {
        heading: "3. Limited Edition Capsule Policy",
        body: "Items marked 'ARCHIVAL' or 'FINAL SALE' are non-refundable, but may be exchanged for store credit if returned within 7 days in brand-new condition.",
      },
    ],
  },
  privacy: {
    title: "PRIVACY POLICY",
    eyebrow: "DATA & SECURITY",
    subcopy: "How Jesusity collects, safeguards, and respects your personal information.",
    content: [
      {
        heading: "1. Information We Collect",
        body: "When you place an order, subscribe to our newsletter, or contact us, we collect your name, phone number, email address and delivery address to fulfil your order and reply to you. We also record anonymous page visits (page, referring site, country, device type) to understand how the store is used. We don't store IP addresses, and visitors with Do Not Track enabled aren't counted.",
      },
      {
        heading: "2. Mobile Money & Payment Security",
        body: "Payments are processed by Paystack, a PCI-DSS compliant payment provider. Your card details and Mobile Money PIN go directly to Paystack and are never seen or stored by Jesusity.",
      },
      {
        heading: "3. No Third-Party Selling",
        body: "Your information is never sold, leased, or distributed to third-party advertising brokers. Data is used exclusively for Jesusity client communication and order fulfillment.",
      },
    ],
  },
  terms: {
    title: "TERMS & CONDITIONS",
    eyebrow: "LEGAL AGREEMENT",
    subcopy: "Standard terms of service governing access to Jesusity digital storefront.",
    content: [
      {
        heading: "1. Overview & Acceptance",
        body: "By accessing or purchasing from Jesusity, you agree to comply with our Terms of Service. All content, trademarks, graphics, and architectural cuts remain the intellectual property of Jesusity.",
      },
      {
        heading: "2. Limited Availability & Pricing",
        body: "All prices are listed in Ghana Cedis (GHS). We reserve the right to correct typographical errors, cancel suspicious transactions, or limit order quantities per household on limited capsule releases.",
      },
      {
        heading: "3. Governing Jurisdiction",
        body: "These terms and conditions are governed by and construed in accordance with the laws of the Republic of Ghana.",
      },
    ],
  },
};

export const Route = createFileRoute("/policies/$slug")({
  head: ({ params }) => {
    const policy = POLICIES[params.slug];
    const title = policy ? policy.title : "Policy Not Found";

    return {
      meta: [
        { title: `${title} | Jesusity` },
        {
          name: "description",
          content: policy?.subcopy || "Official Jesusity policies and guidelines.",
        },
      ],
    };
  },
  component: PolicyDetailPage,
});

function PolicyDetailPage() {
  const { slug } = Route.useParams();
  const policy = POLICIES[slug];

  if (!policy) {
    return (
      <div className="branded-not-found-container">
        <div className="branded-not-found-card">
          <div className="branded-not-found-code">POLICY NOT FOUND</div>
          <h1 className="branded-not-found-title">INVALID DOCUMENT</h1>
          <p className="branded-not-found-desc">
            The legal policy document you requested does not exist. Please select one of our
            official terms below.
          </p>
          <div className="branded-not-found-actions">
            <Link
              to="/policies/$slug"
              params={{ slug: "shipping" }}
              className="branded-not-found-btn-primary"
            >
              VIEW SHIPPING POLICY
            </Link>
            <Link to="/" className="branded-not-found-btn-secondary">
              RETURN HOME
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="policy-page-container">
      <PageHeader eyebrow={policy.eyebrow} title={policy.title} subcopy={policy.subcopy} />

      {/* Policy switcher tabs */}
      <div className="policy-tabs-bar">
        {[
          { id: "shipping", label: "Shipping & Dispatch", icon: Truck },
          { id: "returns", label: "Returns & Exchanges", icon: RotateCcw },
          { id: "privacy", label: "Privacy Policy", icon: ShieldCheck },
          { id: "terms", label: "Terms & Conditions", icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = slug === tab.id;

          return (
            <Link
              key={tab.id}
              to="/policies/$slug"
              params={{ slug: tab.id }}
              className={`policy-tab-link ${isActive ? "active" : ""}`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="policy-content-card">
        {policy.content.map((section) => (
          <div key={section.heading} className="policy-section">
            <h3>{section.heading}</h3>
            <p>{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
