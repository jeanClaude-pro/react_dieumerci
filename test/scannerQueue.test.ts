import test from "node:test";
import assert from "node:assert/strict";
import { createBoundedQueue } from "../src/utils/scannerQueue.ts";

test("push/shift behave as a FIFO", () => {
  const queue = createBoundedQueue<string>(5);
  assert.equal(queue.push("a"), true);
  assert.equal(queue.push("b"), true);
  assert.equal(queue.shift(), "a");
  assert.equal(queue.shift(), "b");
  assert.equal(queue.shift(), undefined);
});

test("queue has a maximum size and rejects pushes past it", () => {
  const queue = createBoundedQueue<number>(3);
  assert.equal(queue.push(1), true);
  assert.equal(queue.push(2), true);
  assert.equal(queue.push(3), true);
  assert.equal(queue.push(4), false, "overflow push must be rejected, not silently grown");
  assert.equal(queue.size, 3);
});

test("clear empties the queue immediately", () => {
  const queue = createBoundedQueue<number>(5);
  queue.push(1);
  queue.push(2);
  queue.clear();
  assert.equal(queue.size, 0);
  assert.equal(queue.shift(), undefined);
});

test("one failed/overflowing item does not block future pushes after clear+retry", () => {
  const queue = createBoundedQueue<number>(2);
  queue.push(1);
  queue.push(2);
  assert.equal(queue.push(3), false);
  queue.clear();
  assert.equal(queue.push(3), true, "queue must accept new work again after being cleared");
});

test("default max size matches MAX_SCANNER_QUEUE_SIZE", async () => {
  const { MAX_SCANNER_QUEUE_SIZE } = await import("../src/utils/scannerQueue.ts");
  const queue = createBoundedQueue<number>();
  for (let i = 0; i < MAX_SCANNER_QUEUE_SIZE; i++) {
    assert.equal(queue.push(i), true);
  }
  assert.equal(queue.push(999), false);
});
