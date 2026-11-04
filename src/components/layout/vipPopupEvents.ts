export const OPEN_VIP_EVENT = "jesusity:open-vip";

/** Opens the VIP sign-up from anywhere, e.g. the announcement bar */
export function openVipPopup() {
  window.dispatchEvent(new Event(OPEN_VIP_EVENT));
}
