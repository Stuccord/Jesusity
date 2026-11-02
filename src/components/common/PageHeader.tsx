import { type ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subcopy?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ eyebrow, title, subcopy, actions, children }: PageHeaderProps) {
  return (
    <div className="page-header-container">
      <div className="page-header-inner">
        {eyebrow && <div className="page-header-eyebrow">{eyebrow}</div>}
        <h1 className="page-header-title">{title}</h1>
        {subcopy && <p className="page-header-subcopy">{subcopy}</p>}
        {actions && <div className="page-header-actions">{actions}</div>}
        {children}
      </div>
    </div>
  );
}
