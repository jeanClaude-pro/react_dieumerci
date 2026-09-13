import test from "node:test";
import assert from "node:assert/strict";
import { cameraReducer, INITIAL_CAMERA_STATE } from "../src/utils/cameraStateMachine.ts";

test("idle -> starting -> active happy path", () => {
  let state = INITIAL_CAMERA_STATE;
  state = cameraReducer(state, { type: "START_REQUESTED" });
  assert.equal(state.state, "starting");
  state = cameraReducer(state, { type: "START_SUCCEEDED" });
  assert.equal(state.state, "active");
  assert.equal(state.error, null);
});

test("a second START_REQUESTED while starting is ignored (no double-start)", () => {
  const state = cameraReducer(INITIAL_CAMERA_STATE, { type: "START_REQUESTED" });
  const again = cameraReducer(state, { type: "START_REQUESTED" });
  assert.deepEqual(again, state);
});

test("a START_REQUESTED while already active is ignored (repeated clicks)", () => {
  let state = cameraReducer(INITIAL_CAMERA_STATE, { type: "START_REQUESTED" });
  state = cameraReducer(state, { type: "START_SUCCEEDED" });
  const again = cameraReducer(state, { type: "START_REQUESTED" });
  assert.deepEqual(again, state);
});

test("START_FAILED moves starting -> error with a message", () => {
  let state = cameraReducer(INITIAL_CAMERA_STATE, { type: "START_REQUESTED" });
  state = cameraReducer(state, { type: "START_FAILED", message: "Permission refusée" });
  assert.equal(state.state, "error");
  assert.equal(state.error, "Permission refusée");
});

test("a stale START_SUCCEEDED after STOPPED/RESET does not resurrect the UI", () => {
  let state = cameraReducer(INITIAL_CAMERA_STATE, { type: "START_REQUESTED" });
  state = cameraReducer(state, { type: "STOP_REQUESTED" });
  state = cameraReducer(state, { type: "STOPPED" });
  const stale = cameraReducer(state, { type: "START_SUCCEEDED" });
  assert.equal(stale.state, "idle", "a late resolve from a superseded start must be discarded");
});

test("a stale START_FAILED after STOPPED does not resurrect the UI", () => {
  let state = cameraReducer(INITIAL_CAMERA_STATE, { type: "START_REQUESTED" });
  state = cameraReducer(state, { type: "STOP_REQUESTED" });
  state = cameraReducer(state, { type: "STOPPED" });
  const stale = cameraReducer(state, { type: "START_FAILED", message: "late error" });
  assert.equal(stale.state, "idle");
});

test("TRACK_ENDED from active moves to error", () => {
  let state = cameraReducer(INITIAL_CAMERA_STATE, { type: "START_REQUESTED" });
  state = cameraReducer(state, { type: "START_SUCCEEDED" });
  state = cameraReducer(state, { type: "TRACK_ENDED" });
  assert.equal(state.state, "error");
});

test("TRACK_ENDED while idle/starting is ignored (nothing to end)", () => {
  const idle = cameraReducer(INITIAL_CAMERA_STATE, { type: "TRACK_ENDED" });
  assert.equal(idle.state, "idle");
});

test("RESET always returns to a clean idle state", () => {
  let state = cameraReducer(INITIAL_CAMERA_STATE, { type: "START_REQUESTED" });
  state = cameraReducer(state, { type: "START_FAILED", message: "x" });
  const reset = cameraReducer(state, { type: "RESET" });
  assert.deepEqual(reset, INITIAL_CAMERA_STATE);
});

test("rapid start/stop/start settles into active without getting stuck", () => {
  let state = INITIAL_CAMERA_STATE;
  state = cameraReducer(state, { type: "START_REQUESTED" });
  state = cameraReducer(state, { type: "STOP_REQUESTED" });
  state = cameraReducer(state, { type: "STOPPED" });
  state = cameraReducer(state, { type: "START_REQUESTED" });
  state = cameraReducer(state, { type: "START_SUCCEEDED" });
  assert.equal(state.state, "active");
});
