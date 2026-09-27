import test from "node:test";
import assert from "node:assert/strict";
import { buildSaleCustomer, isSaleCustomerValid, receiptCustomerName, WALK_IN_LABEL } from "../src/utils/saleCustomer.ts";

const walkIn = (customerName = "", customerPhone = "") => ({ isWalkIn: true, customerName, customerPhone });
const registered = (customerName = "", customerPhone = "") => ({ isWalkIn: false, customerName, customerPhone });

test("walk-in without a name sends no customer and prints the default label", () => {
  assert.equal(buildSaleCustomer(walkIn()), undefined);
  assert.equal(buildSaleCustomer(walkIn("   ")), undefined);
  assert.equal(receiptCustomerName(walkIn()), WALK_IN_LABEL);
});

test("walk-in may carry an optional name, never a phone", () => {
  assert.deepEqual(buildSaleCustomer(walkIn("  Jean ", "0990000000")), { name: "Jean", phone: "", email: "" });
  assert.equal(receiptCustomerName(walkIn(" Jean ")), "Jean");
});

test("walk-in is valid without name or phone", () => {
  assert.equal(isSaleCustomerValid(walkIn()), true);
  assert.equal(isSaleCustomerValid(walkIn("Jean")), true);
});

test("registered customer payload and validation are unchanged", () => {
  assert.deepEqual(buildSaleCustomer(registered("Marie Kabila", "+243 990")), { name: "Marie Kabila", phone: "+243 990", email: "" });
  assert.equal(receiptCustomerName(registered("Marie Kabila", "+243 990")), "Marie Kabila");
  assert.equal(isSaleCustomerValid(registered("Marie Kabila", "")), false);
  assert.equal(isSaleCustomerValid(registered("", "+243 990")), false);
  assert.equal(isSaleCustomerValid(registered("  ", "  ")), false);
  assert.equal(isSaleCustomerValid(registered("Marie Kabila", "+243 990")), true);
});
