import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Entry from "../src/pages/Entry";
import Analytics from "../src/pages/analytics/Analytics";
import { AuthContext } from "../src/context/auth-context";

const user = { id: "u1", username: "Cashier", email: "test@example.com", role: "admin" as const };
const fetchMock = vi.fn();
beforeEach(() => {
  localStorage.setItem("token", "entry-test-token");
  localStorage.setItem("user", JSON.stringify(user));
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(window, "open").mockReturnValue(null);
  fetchMock.mockReset();
});
afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

async function fillEntry(fc = false) {
  const view = render(<AuthContext.Provider value={{ user, token: "entry-test-token", loading: false, setAuth: vi.fn(), clearAuth: vi.fn() }}><Entry /></AuthContext.Provider>);
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  if (fc) fireEvent.click(screen.getByRole("button", { name: /USD.*FC/ }));
  const fields: Record<string, string> = { [fc ? "amountInFC" : "amount"]: fc ? "12000" : "25", source: "Transfert Mobile", category: "Investissement", receivedFromName: "Alice", receivedFromPhone: "+243123", paymentMethod: "bank" };
  for (const [name, value] of Object.entries(fields)) fireEvent.change(view.container.querySelector(`[name="${name}"]`)!, { target: { value } });
  return view.container.querySelector("form")!;
}

test.each([false, true])("records an authenticated %s FC entry and shows the saved reference", async fc => {
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/exchange-rates/current")) return Response.json({ rate: 2850 });
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer entry-test-token");
    const body = JSON.parse(init?.body as string);
    expect(body.paymentMethod).toBe("transfer");
    expect(body.enteredCurrency).toBe(fc ? "FC" : "USD");
    expect(body.amount).toBe(fc ? 12000 / 2850 : 25);
    return Response.json({ ...body, _id: "e1", entryId: "ENTRY-SAVED" }, { status: 201 });
  });
  const form = await fillEntry(fc);
  fireEvent.submit(form);
  expect(await screen.findByText(/Entrée ENTRY-SAVED enregistrée/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /historique/ })).toHaveAttribute("href", "/entryhistory");
});

test("clearing FC input disables submission even when a converted USD value existed", async () => {
  fetchMock.mockResolvedValue(Response.json({ rate: 2850 }));
  const form = await fillEntry(true);
  const submit = screen.getByRole("button", { name: /Enregistrer/ });
  await waitFor(() => expect(submit).toBeEnabled());
  fireEvent.change(form.querySelector('[name="amountInFC"]')!, { target: { value: "" } });
  expect(submit).toBeDisabled();
  fireEvent.submit(form);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("a pending save cannot be submitted twice and a failed save retains input", async () => {
  let resolveSave!: (response: Response) => void;
  fetchMock.mockImplementation((url: string) => url.endsWith("/exchange-rates/current")
    ? Promise.resolve(Response.json({ rate: 2850 }))
    : new Promise<Response>(resolve => { resolveSave = resolve; }));
  const form = await fillEntry();
  fireEvent.submit(form);
  fireEvent.submit(form);
  expect(fetchMock).toHaveBeenCalledTimes(2);
  await act(async () => resolveSave(Response.json({ message: "Authentication required" }, { status: 401 })));
  expect(await screen.findByRole("alert")).toHaveTextContent("Connexion requise");
  expect(screen.queryByRole("link", { name: /historique/ })).not.toBeInTheDocument();
  expect(form.querySelector('[name="amount"]')).toHaveValue(25);
});

test("Analytics displays the entry amount and count from the aggregation response", async () => {
  fetchMock.mockImplementation(async (url: string) => {
    if (url.includes("/analytics/summary")) return Response.json({ source: "mongodb-aggregation", paginated: false, timeframe: { start: "2026-09-28", end: "2026-09-28" }, data: {
      totalSales: 0, totalRevenue: 0, totalCustomers: 0, totalProducts: 0, totalEntries: 125.50, entryCount: 2, totalValidatedExpenses: 0, netRevenue: 125.50,
      chartData: [], topProducts: [], topCustomers: [], paymentMethods: [], expenseStatuses: [], recentTrends: { salesGrowth: null, revenueGrowth: null, customerGrowth: null },
    } });
    return Response.json({});
  });
  render(<Analytics />);
  fireEvent.change(screen.getByLabelText("Mot de passe administrateur"), { target: { value: "test" } });
  fireEvent.click(screen.getByRole("button", { name: "Accéder aux rapports" }));
  const count = await screen.findByText("2 entrées enregistrées");
  expect(count.closest("article")).toHaveTextContent("$125.50");
});
