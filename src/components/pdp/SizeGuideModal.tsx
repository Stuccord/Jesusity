import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { type ProductSizeMeasurement } from "../../data/products";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  sizeChart?: ProductSizeMeasurement[] | undefined;
  selectedSize: string | null;
  productName: string;
}

export function SizeGuideModal({
  isOpen,
  onClose,
  sizeChart,
  selectedSize,
  productName,
}: SizeGuideModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Store trigger for focus restoration
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement | null;
    } else if (triggerRef.current) {
      triggerRef.current.focus();
    }
  }, [isOpen]);

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // Escape key & focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const modal = modalRef.current;
        if (!modal) return;
        const focusable = modal.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="pdp-size-guide-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-size-guide-title"
      onClick={onClose}
    >
      <div ref={modalRef} className="pdp-size-guide-panel" onClick={(e) => e.stopPropagation()}>
        <div className="pdp-size-guide-header">
          <div>
            <span className="pdp-size-guide-eyebrow">MEASUREMENT GUIDE</span>
            <h3 id="pdp-size-guide-title" className="pdp-size-guide-title">
              SIZE GUIDE // {productName}
            </h3>
          </div>
          <button
            type="button"
            className="pdp-size-guide-close-btn"
            onClick={onClose}
            aria-label="Close size guide"
          >
            <X size={20} />
          </button>
        </div>

        {/* Fitting Tip */}
        <div className="pdp-size-guide-tip-box">
          <p className="pdp-size-guide-tip">
            Our fit is oversized. Size down if you prefer a regular fit.{" "}
            {/* TODO confirm with real fit */}
          </p>
        </div>

        {/* Size Chart Table */}
        {sizeChart && sizeChart.length > 0 ? (
          <div className="pdp-size-guide-table-wrap">
            <table className="pdp-size-guide-table">
              <thead>
                <tr>
                  <th scope="col">SIZE</th>
                  <th scope="col">CHEST (CM)</th>
                  <th scope="col">LENGTH (CM)</th>
                  {sizeChart.some((r) => r.shoulder !== undefined) && (
                    <th scope="col">SHOULDER (CM)</th>
                  )}
                  {sizeChart.some((r) => r.sleeve !== undefined) && (
                    <th scope="col">SLEEVE (CM)</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sizeChart.map((row) => {
                  const isSelected = selectedSize === row.size;
                  return (
                    <tr key={row.size} className={isSelected ? "pdp-size-guide-row-selected" : ""}>
                      <td className="pdp-size-cell-label">{row.size}</td>
                      <td>{row.chest}</td>
                      <td>{row.length}</td>
                      {sizeChart.some((r) => r.shoulder !== undefined) && (
                        <td>{row.shoulder ?? "—"}</td>
                      )}
                      {sizeChart.some((r) => r.sleeve !== undefined) && (
                        <td>{row.sleeve ?? "—"}</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="pdp-size-guide-empty">
            <p>Garment measurements for this piece will be available shortly.</p>
          </div>
        )}

        <div className="pdp-size-guide-footer">
          <span className="pdp-size-guide-footer-note">
            All measurements in centimeters. Flat garment specifications with a tolerance of +/-
            1.5cm.
          </span>
        </div>
      </div>
    </div>
  );
}
