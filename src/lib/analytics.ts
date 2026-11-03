import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { getServiceSupabase } from "./supabase/client";

const pageViewSchema = z.object({
  sessionId: z.string().min(8).max(64),
  path: z.string().min(1).max(300),
  referrer: z.string().max(500).optional(),
});

function deviceFrom(ua: string): string {
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) return "Tablet";
  if (/mobi|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return "Mobile";
  return "Desktop";
}

function browserFrom(ua: string): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/samsungbrowser/i.test(ua)) return "Samsung Internet";
  if (/chrome|crios/i.test(ua)) return "Chrome";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua)) return "Safari";
  return "Other";
}

function referrerHost(referrer: string | undefined, ownHost: string | undefined): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (ownHost && host === ownHost.replace(/^www\./, "").split(":")[0]) return null;
    return host;
  } catch {
    return null;
  }
}

const BOT_UA = /bot|crawler|spider|crawling|preview|headless|lighthouse|vercel-screenshot/i;

export const trackPageView = createServerFn({ method: "POST" })
  .validator((input: unknown) => pageViewSchema.parse(input))
  .handler(async ({ data }) => {
    const supabase = getServiceSupabase();
    if (!supabase) return { ok: false };

    const ua = getRequestHeader("user-agent") ?? "";
    if (BOT_UA.test(ua)) return { ok: true };

    const decode = (v: string | undefined) => {
      if (!v) return null;
      try {
        return decodeURIComponent(v);
      } catch {
        return v;
      }
    };

    const { error } = await supabase.from("page_views").insert({
      session_id: data.sessionId,
      path: data.path,
      referrer: referrerHost(data.referrer, getRequestHeader("host")),
      country: getRequestHeader("x-vercel-ip-country") ?? getRequestHeader("cf-ipcountry") ?? null,
      city: decode(getRequestHeader("x-vercel-ip-city")),
      device: deviceFrom(ua),
      browser: browserFrom(ua),
    });
    if (error) console.error("page view insert failed", error);
    return { ok: !error };
  });
