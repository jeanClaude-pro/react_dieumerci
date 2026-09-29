import { formatQuantity } from "../../utils/inventoryFormat";

/**
 * Pieces currently in stock by category. One series, one hue; the value sits
 * at the tip of each bar so nothing depends on hovering.
 */
export default function CategoryBars({ rows, unit = "pièces" }: {
  rows: { category: string; pieces: number; products: number; grouped?: boolean }[];
  unit?: string;
}) {
  const max = Math.max(1, ...rows.map((row) => row.pieces));
  return (
    <ul className="category-bars" aria-label={`Répartition du stock par catégorie (${unit})`}>
      {rows.map((row) => (
        <li key={row.category} className={row.grouped ? "is-grouped" : ""}>
          <span className="category-bars-label">
            <span className="truncate">{row.category}</span>
            <small>{row.products} article{row.products > 1 ? "s" : ""}</small>
          </span>
          <span className="category-bars-track" aria-hidden="true">
            {row.pieces > 0 && <span style={{ width: `${Math.max(1.5, (row.pieces / max) * 100)}%` }} />}
          </span>
          <span className="category-bars-value num">{formatQuantity(row.pieces)}</span>
        </li>
      ))}
    </ul>
  );
}
