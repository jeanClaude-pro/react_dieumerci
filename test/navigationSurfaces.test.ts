import test from "node:test";
import assert from "node:assert/strict";
import {
  canAccessNavigationItem,
  getAccessibleSections,
  getMobilePrimaryItems,
  navigationSections,
} from "../src/config/navigation.ts";
import type { Role, User } from "../src/types/auth.ts";

const user = (role: Role, permissions: string[] = []): User => ({ id: role, username: role, email: `${role}@example.com`, role, permissions });
const allItems = navigationSections.flatMap((section) => section.items);
const ids = (u: User) => getAccessibleSections(u).flatMap((section) => section.items).map((item) => item.id);

test("every navigation surface is derived from the single access rule", () => {
  for (const role of ["admin", "manager", "inventory_manager", "cashier_supervisor", "staff"] as Role[]) {
    const u = user(role);
    assert.deepEqual(ids(u), allItems.filter((item) => canAccessNavigationItem(item, u)).map((item) => item.id));
    for (const item of getMobilePrimaryItems(u)) assert.equal(canAccessNavigationItem(item, u), true);
  }
});

test("phone tab bar shows at most four permitted destinations", () => {
  for (const role of ["admin", "manager", "inventory_manager", "cashier_supervisor", "staff"] as Role[]) {
    assert.ok(getMobilePrimaryItems(user(role)).length <= 4);
  }
  assert.deepEqual(getMobilePrimaryItems(user("admin")).map((item) => item.id), ["home", "pos", "sales", "products"]);
});

test("restricted modules stay hidden from roles that cannot open them", () => {
  const cashier = ids(user("cashier_supervisor"));
  assert.ok(!cashier.includes("reports"));
  assert.ok(!cashier.includes("admin"));
  assert.ok(!cashier.includes("customers"));
  assert.ok(!cashier.includes("products"));
  assert.ok(cashier.includes("payment-approval"));
  assert.ok(!ids(user("manager")).includes("payment-approval"));
});

test("the new sale launcher keeps the historical '/' permission key", () => {
  const pos = allItems.find((item) => item.id === "pos")!;
  assert.equal(pos.path, "/new-sale");
  assert.equal(canAccessNavigationItem(pos, user("manager", ["/"])), true);
  assert.equal(canAccessNavigationItem(pos, user("manager", ["/sales"])), false);
});

test("a staff account without grants only sees the home launcher", () => {
  assert.deepEqual(ids(user("staff")), ["home"]);
});
