import { useQuery } from "@tanstack/react-query";
import { useAdmin } from "./AdminContext";

export interface Overview {
  revenue: number;
  orders: number;
  pending_orders: number;
  abandoned_checkouts: number;
  visitors: number;
  page_views: number;
  visitors_today: number;
  unread_messages: number;
  subscribers: number;
  daily: { date: string; visitors: number; views: number; orders: number; revenue: number }[];
  top_pages: { path: string; views: number; visitors: number }[];
  referrers: { source: string; visitors: number }[];
  countries: { country: string; visitors: number }[];
  devices: { device: string; visitors: number }[];
  top_products: { name: string; units: number; revenue: number }[];
  low_stock: { id: string; name: string; colorway: string; size: string; stock: number }[];
}

export function useOverview(days: number) {
  const { supabase } = useAdmin();
  return useQuery({
    queryKey: ["admin-overview", days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_dashboard", { p_days: days });
      if (error) throw error;
      return data as Overview;
    },
    refetchInterval: 60_000,
  });
}
