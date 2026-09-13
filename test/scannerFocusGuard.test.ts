import test from "node:test";
import assert from "node:assert/strict";
import { isEditableTarget } from "../src/utils/scannerFocusGuard.ts";

test("a plain button/body/div target is not editable", () => {
  assert.equal(isEditableTarget({ tagName: "BUTTON" }), false);
  assert.equal(isEditableTarget({ tagName: "BODY" }), false);
  assert.equal(isEditableTarget({ tagName: "DIV" }), false);
  assert.equal(isEditableTarget(null), false);
  assert.equal(isEditableTarget(undefined), false);
});

test("a foreign <input>/<textarea>/<select> is editable", () => {
  assert.equal(isEditableTarget({ tagName: "INPUT" }), true);
  assert.equal(isEditableTarget({ tagName: "TEXTAREA" }), true);
  assert.equal(isEditableTarget({ tagName: "SELECT" }), true);
});

test("contentEditable elements are editable regardless of tag", () => {
  assert.equal(isEditableTarget({ tagName: "DIV", isContentEditable: true }), true);
});

test("the dedicated scanner input is exempt even though it is an <input>", () => {
  const scannerInput = { tagName: "INPUT" };
  assert.equal(isEditableTarget(scannerInput, scannerInput), false);
});

test("a different <input> element is still treated as editable even when a dedicated input is known", () => {
  const scannerInput = { tagName: "INPUT" };
  const otherInput = { tagName: "INPUT" };
  assert.equal(isEditableTarget(otherInput, scannerInput), true);
});
