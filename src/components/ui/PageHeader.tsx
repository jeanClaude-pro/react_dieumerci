import type { ReactNode } from "react";

/** Standard page heading: eyebrow, title, one-line description and actions. */
export default function PageHeader({ title, description, eyebrow, actions, icon }: {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
}) {
  return <header className="page-header">
    <div>
      {eyebrow && <div className="eyebrow">{icon}{eyebrow}</div>}
      <h1 className="page-title">{title}</h1>
      {description && <p className="page-subtitle">{description}</p>}
    </div>
    {actions && <div className="page-actions">{actions}</div>}
  </header>;
}
