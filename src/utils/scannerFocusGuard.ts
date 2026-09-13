// Pure target-classification helper for the global scanner keydown listener.
// Takes duck-typed objects (not real DOM nodes) so it stays testable under
// plain `node --test` without jsdom — the component passes real
// EventTarget/HTMLElement values, which structurally satisfy this shape.

export interface MinimalEventTarget {
  tagName?: string;
  isContentEditable?: boolean;
}

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/**
 * True when keydown events on this target should be left alone (normal
 * typing into a real form field) rather than fed into the scanner capture
 * buffer. The dedicated scanner input itself is exempt — typing into it is
 * still scanner-relevant — so pass it as `dedicatedInput` when known.
 */
export function isEditableTarget(
  target: MinimalEventTarget | null | undefined,
  dedicatedInput?: MinimalEventTarget | null
): boolean {
  if (!target) return false;
  if (dedicatedInput && target === dedicatedInput) return false;
  if (target.isContentEditable) return true;
  return EDITABLE_TAGS.has(target.tagName ?? "");
}
