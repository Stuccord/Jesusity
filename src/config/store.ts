// Business settings in one place. Prices are charged in Ghana cedis.

export const STORE: {
  name: string;
  currency: "GHS";
  deliveryFee: number;
  freeDeliveryThreshold: number;
  deliveryEstimate: string;
  returnWindowDays: number;
  maxQuantityPerItem: number;
  contact: { email: string; phone: string; whatsapp: string; location: string; hours: string };
  social: { instagram: string; x: string; facebook: string; tiktok: string };
} = {
  name: "Jesusity",
  currency: "GHS",
  /** Flat delivery fee in GH₵ for orders under the free-delivery threshold */
  deliveryFee: 35,
  /** Orders at or above this subtotal (GH₵) ship free */
  freeDeliveryThreshold: 500,
  /** Shown on product pages; change to match your courier */
  deliveryEstimate: "Delivery in Accra: 1–2 business days. Other regions: 2–5 business days.",
  /** Days after delivery that unworn items can be returned */
  returnWindowDays: 14,
  /** Max units of one size per order line */
  maxQuantityPerItem: 10,
  /**
   * Public contact details shown on the contact page and footer.
   * Leave a value empty ("") to hide it.
   */
  contact: {
    email: "",
    phone: "",
    whatsapp: "",
    location: "Accra, Ghana",
    hours: "Mon – Sat, 9:00 – 18:00 GMT",
  },
  /** Full profile URLs, e.g. "https://instagram.com/jesusity". Empty ones are hidden. */
  social: {
    instagram: "",
    x: "",
    facebook: "",
    tiktok: "",
  },
};

export const GHANA_REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Central",
  "Eastern",
  "Western",
  "Western North",
  "Volta",
  "Oti",
  "Northern",
  "Savannah",
  "North East",
  "Upper East",
  "Upper West",
  "Bono",
  "Bono East",
  "Ahafo",
] as const;

export function deliveryFeeFor(subtotal: number): number {
  return subtotal >= STORE.freeDeliveryThreshold ? 0 : STORE.deliveryFee;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: "Awaiting payment",
  payment_failed: "Payment failed",
  paid: "Payment received",
  processing: "Being prepared",
  shipped: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};
