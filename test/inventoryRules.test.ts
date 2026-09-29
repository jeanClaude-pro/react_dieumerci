import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isProductSellable, productAvailabilityLabel, stockHealth } from "../src/utils/productAvailability.ts";
import { describePeriod, isValidCustomRange, presetRange } from "../src/utils/dashboardPeriod.ts";
import { canAccessNavigationItem, getMobilePrimaryItems, navigationSections } from "../src/config/navigation.ts";
import type { Role, User } from "../src/types/auth.ts";

test("client sellability mirrors the server rule: active and at least one piece", () => {
  assert.equal(isProductSellable({ stock: 1, status: "active" }), true);
  assert.equal(isProductSellable({ stock: 0, status: "active" }), false);
  assert.equal(isProductSellable({ stock: -2, status: "active" }), false);
  assert.equal(isProductSellable({ stock: 30, status: "inactive" }), false);
  assert.equal(isProductSellable(null), false);
});

test("stock health and labels: exact minimum is low, no minimum never low, inactive wins", () => {
  assert.equal(stockHealth({ stock: 10, minStock: 10 }), "low");
  assert.equal(stockHealth({ stock: 1, minStock: 0 }), "ok");
  assert.equal(stockHealth({ stock: 0, minStock: 0 }), "out");
  assert.deepEqual(productAvailabilityLabel({ stock: 0, minStock: 5, status: "active" }), { label: "En rupture", tone: "danger" });
  assert.deepEqual(productAvailabilityLabel({ stock: 0, minStock: 5, status: "inactive" }), { label: "Inactif", tone: "neutral" });
  assert.deepEqual(productAvailabilityLabel({ stock: 3, minStock: 5, status: "active" }), { label: "Stock faible", tone: "warning" });
});

test("dashboard presets use the Lubumbashi business day, Monday-based weeks and whole months", () => {
  // 2026-09-28T22:30Z is Tuesday 29 September, 00:30 in Lubumbashi.
  const now = new Date("2026-09-28T22:30:00Z");
  assert.deepEqual(presetRange("today", now), { from: "2026-09-29", to: "2026-09-29" });
  assert.deepEqual(presetRange("yesterday", now), { from: "2026-09-28", to: "2026-09-28" });
  assert.deepEqual(presetRange("week", now), { from: "2026-09-28", to: "2026-09-29" });
  assert.deepEqual(presetRange("month", now), { from: "2026-09-01", to: "2026-09-29" });
  // Sunday belongs to the week that started on the previous Monday.
  assert.deepEqual(presetRange("week", new Date("2026-10-04T10:00:00Z")), { from: "2026-09-28", to: "2026-10-04" });
  // Crossing a year boundary.
  assert.deepEqual(presetRange("yesterday", new Date("2026-01-01T08:00:00Z")), { from: "2025-12-31", to: "2025-12-31" });
});

test("custom ranges must be ordered, well-formed and not start in the future", () => {
  const now = new Date("2026-09-29T08:00:00Z");
  assert.equal(isValidCustomRange({ from: "2026-09-01", to: "2026-09-29" }, now), true);
  assert.equal(isValidCustomRange({ from: "2026-09-10", to: "2026-09-01" }, now), false);
  assert.equal(isValidCustomRange({ from: "2026-10-01", to: "2026-10-02" }, now), false);
  assert.equal(isValidCustomRange({ from: "", to: "2026-09-02" }, now), false);
  assert.match(describePeriod({ from: "2026-09-28", to: "2026-09-28" }), /28 sept\. 2026/);
  assert.match(describePeriod({ from: "2026-09-01", to: "2026-09-28" }), /^Du .* au /);
});

const user = (role: Role, permissions: string[] = []): User => ({ id: role, username: role, email: `${role}@example.com`, role, permissions });
const dashboard = navigationSections.flatMap((section) => section.items).find((item) => item.path === "/dashboard")!;

test("the Dashboard is admin-only in every navigation surface, even with custom grants", () => {
  assert.ok(dashboard);
  assert.equal(canAccessNavigationItem(dashboard, user("admin")), true);
  for (const role of ["manager", "inventory_manager", "cashier_supervisor", "staff"] as Role[]) {
    assert.equal(canAccessNavigationItem(dashboard, user(role)), false, role);
    assert.equal(canAccessNavigationItem(dashboard, user(role, ["/dashboard"])), false, `${role} with grant`);
  }
  assert.deepEqual(getMobilePrimaryItems(user("admin")).map((item) => item.id), ["home", "pos", "sales", "products"]);
});

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("the Dashboard route is guarded by the admin role, not only hidden from navigation", () => {
  const app = read("../src/App.tsx");
  assert.match(app, /path="\/dashboard"[\s\S]{0,120}<RequireRole roles=\{\["admin"\]\}><Dashboard \/>/);
});

test("NewSale lists only sellable products and refreshes them after each sale attempt", () => {
  const newSale = read("../src/pages/NewSale.tsx");
  assert.match(newSale, /\/products\?availability=sellable/);
  assert.match(newSale, /list\.filter\(isProductSellable\)/);
  assert.ok((newSale.match(/fetchSellableProducts\(\)\.then\(setProducts\)/g) || []).length >= 2);
  assert.doesNotMatch(newSale, /fetch\(`\$\{API_BASE\}\/products`/);
});

test("Dashboard figures come from the server aggregation, never from client-side sums", () => {
  const page = read("../src/pages/dashboard/Dashboard.tsx");
  assert.match(page, /dashboard\/summary\?/);
  assert.doesNotMatch(page, /\/sales|\/products\?/);
  assert.doesNotMatch(page, /\.reduce\(/);
});

test("a product edit sends the stock only when the administrator changed it", () => {
  const products = read("../src/pages/products/products.tsx");
  assert.match(products, /const stockChanged = stock !== selectedProduct\.stock/);
  assert.match(products, /stockChanged \? formData : otherFields, stockChanged \? selectedProduct\.stock : undefined/);
  assert.match(products, /expectedStock/);
  assert.doesNotMatch(products, /deleteProduct|method:\s*"DELETE"|Trash2/);
  assert.match(products, /products\?includeInactive=true/);
});

test("history screens share the Fiche de stock calendar and have no show-filters control", () => {
  for (const file of ["../src/pages/history/SalesHistory.tsx", "../src/pages/SortieHistory.tsx"]) {
    const page = read(file);
    assert.match(page, /import PeriodPicker/);
    assert.match(page, /<PeriodPicker/);
    assert.doesNotMatch(page, /showFilters|setShowFilters/);
  }
});

test("chart ticks always enclose the data, including a flat series (regression)", async () => {
  const { niceTicks } = await import("../src/utils/chartScale.ts");
  for (const [min, max] of [[470, 470], [0, 0], [480, 520], [3, 1250], [0.2, 0.9], [-5, 12], [10466, 10468]]) {
    const ticks = niceTicks(min, max);
    assert.ok(ticks.length >= 2, `${min}-${max}: ${ticks}`);
    assert.ok(ticks[0] <= min && ticks[ticks.length - 1] >= max, `${min}-${max}: ${ticks}`);
  }
  assert.deepEqual(niceTicks(470, 470), [400, 600]);
});
