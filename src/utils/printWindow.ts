/**
 * Prints a document written into a pop-up window, then closes it.
 * Runs from the app's own code instead of a <script> inside the printed
 * HTML, so the strict Content-Security-Policy (no inline scripts) still
 * allows printing.
 */
export function printAndClose(win: Window): void {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    try {
      win.focus();
      win.print();
    } catch {
      // The user can still print with Ctrl+P.
    }
    window.setTimeout(() => {
      try { win.close(); } catch { /* already closed */ }
    }, 1000);
  };
  if (win.document.readyState === "complete") run();
  else win.addEventListener("load", run, { once: true });
}
