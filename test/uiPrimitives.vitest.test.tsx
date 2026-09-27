import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import Dialog from "../src/components/ui/Dialog";
import ResponsiveTable from "../src/components/ui/ResponsiveTable";

describe("Dialog", () => {
  function Harness({ onClose }: { onClose: () => void }) {
    const [open, setOpen] = useState(false);
    return <div id="root-like">
      <button onClick={() => setOpen(true)}>Ouvrir</button>
      {open && <Dialog label="Détails" onClose={() => { onClose(); setOpen(false); }}>
        <div><h2>Détails</h2><button>Action</button></div>
      </Dialog>}
    </div>;
  }

  it("is an accessible modal that closes on Escape and restores focus", () => {
    const root = document.createElement("div");
    root.id = "root";
    document.body.appendChild(root);
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />, { container: root });

    const trigger = screen.getByText("Ouvrir");
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Détails" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(document.activeElement).toBe(dialog);
    expect(root).toHaveAttribute("inert");
    // Rendered outside the app root so toasts and the tab bar stay independent.
    expect(root.contains(dialog)).toBe(false);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(root).not.toHaveAttribute("inert");
    expect(document.activeElement).toBe(trigger);
    root.remove();
  });
});

describe("ResponsiveTable", () => {
  it("labels every cell with its column and keeps every action", () => {
    const onEdit = vi.fn();
    render(<ResponsiveTable>
      <thead><tr><th>#</th><th>Article</th><th>Stock</th><th>Actions</th></tr></thead>
      <tbody>
        {[1, 2].map((n) => <tr key={n}>
          <td>{n}</td><td>Article {n}</td><td>{n * 10}</td>
          <td><button aria-label={`Modifier ${n}`} onClick={() => onEdit(n)}>M</button></td>
        </tr>)}
        <tr><td colSpan={4}>Pied</td></tr>
      </tbody>
    </ResponsiveTable>);

    const cell = screen.getByText("Article 1");
    expect(cell).toHaveAttribute("data-label", "Article");
    expect(cell).toHaveAttribute("data-primary", "true");
    expect(screen.getByText("10")).toHaveAttribute("data-label", "Stock");
    expect(screen.getByText("1")).toHaveAttribute("data-index", "true");
    expect(screen.getByText("Pied")).not.toHaveAttribute("data-label");

    fireEvent.click(screen.getByRole("button", { name: "Modifier 2" }));
    expect(onEdit).toHaveBeenCalledWith(2);
    expect(screen.getByRole("button", { name: "Modifier 2" }).closest("td")).toHaveAttribute("data-actions", "true");
    expect(document.querySelector(".ui-table-wrap")).toHaveAttribute("data-stack", "md");
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});
