// Pure, framework-free bounded FIFO queue for buffering scanner tokens while
// a request is in flight. Kept dependency-free so it can be exercised by
// `node --experimental-strip-types --test` without a browser/DOM — see
// scannerInput.ts for the same convention.
//
// Bounded on purpose: an unbounded queue combined with a stuck/slow consumer
// would let a long outage turn into an unbounded backlog that then replays in
// one burst the moment connectivity returns. Overflowing drops the backlog
// (see ReceiptScannerPage) rather than growing further.

export const MAX_SCANNER_QUEUE_SIZE = 5;

export interface BoundedQueue<T> {
  /** Returns false (and does not enqueue) when the queue is already full. */
  push(item: T): boolean;
  shift(): T | undefined;
  clear(): void;
  readonly size: number;
}

export function createBoundedQueue<T>(maxSize: number = MAX_SCANNER_QUEUE_SIZE): BoundedQueue<T> {
  let items: T[] = [];
  return {
    push(item: T): boolean {
      if (items.length >= maxSize) return false;
      items.push(item);
      return true;
    },
    shift(): T | undefined {
      return items.shift();
    },
    clear(): void {
      items = [];
    },
    get size(): number {
      return items.length;
    },
  };
}
