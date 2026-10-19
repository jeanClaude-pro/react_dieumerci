/**
 * jsPDF's built-in Helvetica covers WinAnsi only. Intl formatting inserts
 * narrow / no-break spaces and a few typographic signs that it cannot draw.
 */
export function pdfSafe(value: string): string {
  return value
    .replace(/[\u00A0\u202F\u2009]/g, " ")
    .replace(/\u2212/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x20-\xFF\n\u20AC\u2018\u2019\u201C\u201D\u2022]/g, "");
}
