import test from "node:test";
import assert from "node:assert/strict";
import { canAccessNavigationItem, navigationSections } from "../src/config/navigation.ts";
import type { Role, User } from "../src/types/auth.ts";

const item = (path: string) => navigationSections.flatMap((section) => section.items).find((entry) => entry.path === path)!;
const user = (role: Role, permissions: string[] = []): User => ({ id: role, username: role, email: `${role}@example.com`, role, permissions });

test("mobile and desktop navigation rules preserve fixed operational roles", () => {
  assert.equal(canAccessNavigationItem(item("/payment-approval"), user("cashier_supervisor")), true);
  assert.equal(canAccessNavigationItem(item("/payment-approval"), user("inventory_manager", ["/payment-approval"])), false);
  assert.equal(canAccessNavigationItem(item("/payment-verification"), user("inventory_manager")), true);
  assert.equal(canAccessNavigationItem(item("/admin"), user("manager", ["/admin"])), false);
});

test("custom page permissions drive ordinary module visibility", () => {
  const manager = user("manager", ["/sales"]);
  assert.equal(canAccessNavigationItem(item("/sales"), manager), true);
  assert.equal(canAccessNavigationItem(item("/entry"), manager), false);
});

test("default role navigation remains available when no custom permissions exist", () => {
  assert.equal(canAccessNavigationItem(item("/"), user("admin")), true);
  assert.equal(canAccessNavigationItem(item("/products"), user("manager")), true);
  assert.equal(canAccessNavigationItem(item("/sales"), user("cashier_supervisor")), true);
  assert.equal(canAccessNavigationItem(item("/products"), user("inventory_manager")), true);
  assert.equal(canAccessNavigationItem(item("/sales"), user("staff")), false);
});
