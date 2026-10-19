import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import Dashboard from "../src/pages/dashboard/Dashboard";
import StockCardDialog from "../src/components/inventory/StockCardDialog";
import NewSale from "../src/pages/NewSale";
import { AuthContext } from "../src/context/auth-context";
import type { DashboardSummary, StockCardResponse } from "../src/types/inventory";

const fetchMock = vi.fn();
const admin = { id: "a1", username: "Admin", email: "admin@example.com", role: "admin" as const };

beforeEach(() => {
  localStorage.setItem("token", "dashboard-test-token");
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  fetchMock.mockReset();
});
afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const flows = { baseline: 0, entries: 20, newProducts: 0, piecesOut: 17, returns: 0, adjustmentsIn: 0, adjustmentsOut: 1, net: 2 };
function summary(overrides: Partial<DashboardSummary> = {}): DashboardSummary {
  return {
    generatedAt: "2026-09-29T10:00:00.000Z",
    period: { start: "2026-09-28T22:00:00.000Z", end: "2026-09-29T21:59:59.999Z", granularity: "day", endIsNow: true },
    coverage: { trackingStartedAt: "2026-01-01T06:00:00.000Z", untrackedProducts: 0, openingKnown: true, closingKnown: true, flowsComplete: true, flowsAvailable: true },
    stock: { unit: "piece", opening: 10466, closing: 10468, current: 10468, flows },
    health: { products: 6, pieceProducts: 6, active: 4, inactive: 2, sellable: 3, outOfStock: 1, lowStock: 2, becameOutOfStock: 1 },
    activity: { sale: 3, restock: 1, sale_void: 1, adjustment: 1 },
    soldProductMovements: [
      { productId: "P1", name: "Sac noir", category: "Sacs", unit: "pcs", unitKey: "piece", currentStock: 0, minStock: 5, openingStock: 5, closingStock: 0, flows: { ...flows, entries: 0, piecesOut: 5, adjustmentsOut: 0, net: -5 } },
      { productId: "PACK", name: "Carton", category: "Emballages", unit: "packs", unitKey: "packs", currentStock: 101, minStock: 5, openingStock: 105, closingStock: 101, flows: { ...flows, entries: 0, piecesOut: 4, adjustmentsOut: 0, net: -4 } },
    ],
    transactions: { sales: 2 },
    series: [{ key: "2026-09-29", net: 2, level: 10468 }],
    categories: [{ category: "Sacs", pieces: 10468, products: 6 }],
    units: [{ unit: "pcs", dimension: "piece", products: 4, quantity: 10468 }],
    attention: [{ _id: "P1", name: "Sac noir", category: "Sacs", stock: 0, minStock: 5, gap: 5, status: "active" }],
    ...overrides,
  };
}

const renderDashboard = () => render(<Dashboard />);
const calledPaths = () => fetchMock.mock.calls.map(([url]) => String(url).replace("https://api.test.invalid/api/", ""));

test("no figure is shown while loading; server figures appear once loaded", async () => {
  let resolve!: (response: Response) => void;
  fetchMock.mockImplementation(() => new Promise<Response>((done) => { resolve = done; }));
  renderDashboard();
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  expect(calledPaths()[0]).toMatch(/^dashboard\/summary\?from=\d{4}-\d{2}-\d{2}&to=\d{4}-\d{2}-\d{2}$/);
  expect(screen.queryByText("Stock au début")).toBeNull();
  expect(screen.queryByText("0")).toBeNull();

  resolve(Response.json(summary()));
  expect(await screen.findByRole("region", { name: "Mouvements de stock" })).toBeInTheDocument();
  const flowsSection = screen.getByRole("region", { name: "Mouvements de stock" });
  expect(within(flowsSection).getByText("10 466")).toBeInTheDocument();
  expect(within(flowsSection).getByText("10 468")).toBeInTheDocument();
  expect(within(flowsSection).getByText("17")).toBeInTheDocument();
  expect(within(flowsSection).getByText("20")).toBeInTheDocument();
  expect(screen.getAllByText("Sac noir").length).toBeGreaterThan(0);
});

test("history the ledger cannot prove is shown as “—”, never as a number", async () => {
  fetchMock.mockResolvedValue(Response.json(summary({
    coverage: { trackingStartedAt: "2026-09-29T08:00:00.000Z", untrackedProducts: 0, openingKnown: false, closingKnown: true, flowsComplete: false, flowsAvailable: true },
    stock: { unit: "piece", opening: null, closing: 10468, current: 10468, flows },
  })));
  renderDashboard();
  expect(await screen.findAllByText("Non reconstructible (avant le début du suivi)")).not.toHaveLength(0);
  expect(screen.getByRole("note")).toHaveTextContent(/suivi détaillé du stock a commencé/);
  expect(screen.getAllByText(/^Partiel : depuis le/)).toHaveLength(2);
});

test("mixed inventory units are never added to the pieces KPIs", async () => {
  fetchMock.mockResolvedValue(Response.json(summary({
    units: [
      { unit: "pcs", dimension: "piece", products: 5, quantity: 10468 },
      { unit: "kg", dimension: "kg", products: 1, quantity: 50 },
      { unit: "lbs", dimension: "lbs", products: 1, quantity: 20 },
    ],
  })));
  renderDashboard();
  expect(await screen.findByText(/incluent uniquement les articles comptés à la pièce/)).toBeInTheDocument();
  expect(screen.getByText(/50 kg/)).toBeInTheDocument();
  expect(screen.getByText(/20 lbs/)).toBeInTheDocument();
  expect(screen.queryByText(/10 538/)).toBeNull();
  // The story view is the default; the same figures are available as a table.
  expect(screen.getAllByText(/Au début de la période, vous aviez 105 packs/).length).toBe(1);
  fireEvent.click(screen.getByRole("radio", { name: /Tableau/ }));
  const productMovements = screen.getByRole("table", { name: "Mouvements par article vendu" });
  expect(within(productMovements).getByText("Sac noir")).toBeInTheDocument();
  expect(within(productMovements).getByText("Carton")).toBeInTheDocument();
  expect(within(productMovements).getByText("packs")).toBeInTheDocument();
});

test("an API error offers a retry that refetches", async () => {
  fetchMock.mockResolvedValueOnce(Response.json({ message: "Impossible de charger le tableau de bord" }, { status: 500 }));
  fetchMock.mockResolvedValueOnce(Response.json(summary()));
  renderDashboard();
  fireEvent.click(await screen.findByRole("button", { name: /Réessayer/ }));
  expect(await screen.findByRole("region", { name: "Mouvements de stock" })).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test("choosing another period requests that period and never shows the previous figures", async () => {
  fetchMock.mockResolvedValueOnce(Response.json(summary()));
  fetchMock.mockImplementationOnce(() => new Promise(() => undefined));
  renderDashboard();
  await screen.findByRole("region", { name: "Mouvements de stock" });
  fireEvent.click(screen.getByRole("radio", { name: "Hier" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  const [first, second] = calledPaths();
  const from = (path: string) => new URLSearchParams(path.split("?")[1]).get("from")!;
  expect(from(second) < from(first)).toBe(true);
  expect(screen.queryByText("10 466")).toBeNull();
});

test("the low-stock card opens a server-paginated list with its empty message", async () => {
  fetchMock.mockImplementation(async (url: string) => String(url).includes("stock-alerts")
    ? Response.json({ data: [], pagination: { page: 1, limit: 20, totalRecords: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } })
    : Response.json(summary()));
  renderDashboard();
  fireEvent.click(await screen.findByRole("button", { name: /Stock faible : 2/ }));
  expect(await screen.findByText("Aucun produit sous le stock minimum.")).toBeInTheDocument();
  expect(calledPaths().find((path) => path.startsWith("dashboard/stock-alerts"))).toMatch(/kind=low&page=1&limit=20/);
});

test("the fiche de stock shows its empty message and the last real stock update", async () => {
  const card: StockCardResponse = {
    period: { start: "2026-08-31T22:00:00.000Z", end: "2026-09-29T21:59:59.999Z", granularity: "day" },
    product: { _id: "P1", name: "Sac noir", category: "Sacs", unit: "pcs", stock: 12, minStock: 5, status: "active", lastStockUpdatedAt: "2026-08-15T09:00:00.000Z" },
    summary: { opening: 12, closing: 12, flows: { ...flows, entries: 0, piecesOut: 0, adjustmentsOut: 0, net: 0 }, currentStock: 12, lastStockUpdatedAt: "2026-08-15T09:00:00.000Z" },
    coverage: { trackingStartedAt: "2026-01-01T00:00:00.000Z", baselineAt: null, openingKnown: true, closingKnown: true, flowsComplete: true, flowsAvailable: true },
    integrity: { ledgerStock: 12, consistent: true },
  };
  fetchMock.mockResolvedValue(Response.json(card));
  render(<StockCardDialog productId="P1" productName="Sac noir" onClose={vi.fn()} />);
  const movementSummary = await screen.findByLabelText("Résumé des mouvements de stock");
  expect(within(movementSummary).getByText("Entrées en stock")).toBeInTheDocument();
  expect(within(movementSummary).getByText("Retours")).toBeInTheDocument();
  expect(within(movementSummary).getByText("Sorties")).toBeInTheDocument();
  expect(within(movementSummary).getByText("Solde de reprise")).toBeInTheDocument();
  expect(screen.getByText(/15 août 2026/)).toBeInTheDocument();
  expect(calledPaths()[0]).toMatch(/^products\/P1\/stock-card\?from=\d{4}-\d{2}-01&to=/);
  expect(calledPaths()[0]).not.toMatch(/page=|limit=/);
});

test("NewSale asks for sellable products and never offers a product at 0 pieces", async () => {
  fetchMock.mockImplementation(async (url: string) => {
    if (String(url).includes("/products")) {
      return Response.json([
        { _id: "A", name: "Sac disponible", stock: 4, price: 10, status: "active" },
        // A stale or older server response: the client guard still hides these.
        { _id: "B", name: "Sac vendu", stock: 0, price: 10, status: "active" },
        { _id: "C", name: "Sac retiré", stock: 9, price: 10, status: "inactive" },
      ]);
    }
    if (String(url).includes("exchange-rates")) return Response.json({ rate: 2850 });
    return Response.json({});
  });
  const view = render(
    <AuthContext.Provider value={{ user: admin, token: "dashboard-test-token", loading: false, setAuth: vi.fn(), clearAuth: vi.fn() }}>
      <NewSale />
    </AuthContext.Provider>
  );
  await waitFor(() => expect(calledPaths()).toContain("products?availability=sellable"));
  const search = view.container.querySelector<HTMLInputElement>("#pos-search")!;
  await waitFor(() => expect(search).toBeEnabled());
  fireEvent.change(search, { target: { value: "Sac" } });
  const results = await screen.findByRole("listbox", { name: "Articles trouvés" });
  expect(within(results).getByText("Sac disponible")).toBeInTheDocument();
  expect(within(results).queryByText("Sac vendu")).toBeNull();
  expect(within(results).queryByText("Sac retiré")).toBeNull();
});
