import { STORE } from "../../config/store";
import { openVipPopup } from "./vipPopupEvents";

export function AnnouncementBar() {
  return (
    <div className="promo-bar" role="region" aria-label="Announcement">
      <span aria-hidden="true" />
      <button type="button" className="promo-vip-link" onClick={openVipPopup}>
        VIP members get {STORE.vipDiscountPercent}% discount
      </button>
      <span aria-hidden="true" />
    </div>
  );
}
