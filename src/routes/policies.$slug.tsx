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
    subcopy: "Standard, express, and international shipping protocols from our Accra studio.",
    content: [
      {
        heading: "1. Accra Metrowide Delivery",
        body: "All orders within Accra and Tema are fulfilled through dedicated courier riders. Orders placed prior to 1:00 PM GMT are eligible for same-day delivery. Standard delivery operates next business day. Orders totaling GH₵500 or more qualify automatically for complimentary shipping.",
      },
      {
        heading: "2. Nationwide Ghana Transit",
        body: "For regions outside Greater Accra (including Ashanti, Western, Central, Eastern, and Northern regions), packages are dispatched through regional freight partners. Transit typically requires 2 to 3 business days with active SMS notification.",
      },
      {
        heading: "3. International Destinations",
        body: "We partner with DHL Express for worldwide shipping across Europe, North America, and continental Africa. Delivery transit spans 3–6 business days. Import duties or customs taxes applied by the recipient's country are the responsibility of the purchaser.",
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
        body: "We accept returns for unworn, unwashed garments in pristine condition with original hangtags intact within 14 calendar days of delivery confirmation.",
      },
      {
        heading: "2. Size Exchange Process",
        body: "If your garment does not fit as desired, contact our concierge immediately. If your replacement size is in stock, we will reserve it and arrange a complimentary pickup and swap in Accra.",
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
    subcopy: "How Supernatural collects, safeguards, and respects your personal information.",
    content: [
      {
        heading: "1. Information We Collect",
        body: "When you place an order, subscribe to our newsletter, or contact our studio, we collect your name, phone number, email address, and delivery coordinates strictly to fulfill your order and provide service updates.",
      },
      {
        heading: "2. Mobile Money & Payment Security",
        body: "We never store raw credit card details or Mobile Money PINs on our servers. All transactions are securely routed through PCI-DSS Level 1 compliant gateway processors with end-to-end encryption.",
      },
      {
        heading: "3. No Third-Party Selling",
        body: "Your information is never sold, leased, or distributed to third-party advertising brokers. Data is used exclusively for Supernatural client communication and order fulfillment.",
      },
    ],
  },
  terms: {
    title: "TERMS & CONDITIONS",
    eyebrow: "LEGAL AGREEMENT",
    subcopy: "Standard terms of service governing access to Supernatural digital storefront.",
    content: [
      {
        heading: "1. Overview & Acceptance",
        body: "By accessing or purchasing from Supernatural Apparel, you agree to comply with our Terms of Service. All content, trademarks, graphics, and architectural cuts remain the intellectual property of Supernatural.",
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
        { title: `${title} | Supernatural Apparel` },
        {
          name: "description",
          content: policy?.subcopy || "Official Supernatural policies and guidelines.",
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
