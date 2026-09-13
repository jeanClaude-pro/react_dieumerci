import test from "node:test";
import assert from "node:assert/strict";
import { canUseCamera } from "../src/utils/cameraAccess.ts";

test("admin may use the camera", () => {
  assert.equal(canUseCamera("admin"), true);
});

test("cashier_supervisor may not use the camera", () => {
  assert.equal(canUseCamera("cashier_supervisor"), false);
});

test("inventory_manager may not use the camera", () => {
  assert.equal(canUseCamera("inventory_manager"), false);
});

test("manager and staff may not use the camera", () => {
  assert.equal(canUseCamera("manager"), false);
  assert.equal(canUseCamera("staff"), false);
});

test("no user / unknown role may not use the camera", () => {
  assert.equal(canUseCamera(null), false);
  assert.equal(canUseCamera(undefined), false);
});
