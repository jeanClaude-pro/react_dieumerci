import { Children, cloneElement, isValidElement, type ReactNode, type ReactElement, type TableHTMLAttributes } from "react";

type ElementProps = {
  children?: ReactNode;
  colSpan?: number;
  scope?: string;
  role?: string;
  "data-label"?: string;
  "data-primary"?: boolean;
  "data-actions"?: boolean;
  "data-bare"?: boolean;
  "data-index"?: boolean;
};

function textContent(node: ReactNode): string {
  return Children.toArray(node).map(child => isValidElement<ElementProps>(child)
    ? textContent(child.props.children) : typeof child === "string" || typeof child === "number" ? String(child) : "").join(" ").replace(/\s+/g, " ").trim();
}

/**
 * Adapts the existing rendered cells instead of re-rendering rows: no second
 * row renderer, no hidden actions, no duplicated permission or calculation
 * logic. Each cell is labelled with its column header so that, when the
 * space available to the table is narrow, CSS can present every row as a
 * card that still contains every value and every action button.
 *
 * The card breakpoint follows the column count (wide tables stack earlier)
 * and is evaluated against the table's own container, so a table beside a
 * sidebar or inside a dialog adapts to the width it actually has.
 */
export default function ResponsiveTable({ children, className = "", stack, ...props }: TableHTMLAttributes<HTMLTableElement> & {
  /** Override the automatic card breakpoint. */
  stack?: "md" | "lg" | "none";
}) {
  const headers: string[] = [];
  function collect(nodes: ReactNode) {
    Children.forEach(nodes, child => {
      if (!isValidElement<ElementProps>(child)) return;
      if (child.type === "th") headers.push(textContent(child.props.children));
      else if (child.type !== "tbody" && child.type !== "tfoot") collect(child.props.children);
    });
  }
  collect(children);

  function decorate(nodes: ReactNode, section: string): ReactNode {
    return Children.map(nodes, child => {
      if (!isValidElement<ElementProps>(child)) return child;
      if (child.type === "tr") {
        let column = 0;
        let primaryAssigned = false;
        function cells(nodes: ReactNode): ReactNode {
          return Children.map(nodes, cell => {
            if (!isValidElement<ElementProps>(cell)) return cell;
            if (cell.type === "td" || cell.type === "th") {
              const label = headers[column] || "";
              column += cell.props.colSpan || 1;
              if (section === "thead") return cloneElement(cell, { scope: "col", role: "columnheader" });
              if (cell.props.colSpan && cell.props.colSpan > 1) return cloneElement(cell, { role: "cell" });
              const isActions = /^actions?$/i.test(label);
              const isIndex = label === "#";
              const isPrimary = !primaryAssigned && label !== "" && !isActions && !isIndex && section === "tbody";
              if (isPrimary) primaryAssigned = true;
              return cloneElement(cell, {
                role: "cell",
                "data-label": label,
                "data-primary": isPrimary || undefined,
                "data-actions": isActions || undefined,
                "data-bare": label === "" || undefined,
                "data-index": isIndex || undefined,
              });
            }
            return cloneElement(cell, {}, cells(cell.props.children));
          });
        }
        return cloneElement(child, { role: "row" }, cells(child.props.children));
      }
      const tag = typeof child.type === "string" ? child.type : section;
      // Explicit roles keep table semantics when CSS turns rows into cards.
      const role = ["thead", "tbody", "tfoot"].includes(tag) && typeof child.type === "string" ? { role: "rowgroup" } : {};
      return cloneElement(child as ReactElement<ElementProps>, role, decorate(child.props.children, tag));
    });
  }

  const columns = headers.length;
  const mode = stack ?? (columns >= 8 ? "lg" : columns >= 3 ? "md" : "none");
  return (
    <div className="ui-table-wrap" data-stack={mode === "none" ? undefined : mode}>
      <table {...props} role="table" className={`ui-table ${className}`}>{decorate(children, "table")}</table>
    </div>
  );
}
