/**
 * Seasonal greeting printed on 80mm thermal receipts.
 *
 * Presentation only: it never reads or changes receipt data, amounts or
 * payment information. The season is evaluated on the store's business
 * calendar (Lubumbashi, UTC+2, no DST), the same calendar used by
 * utils/businessTimeframe.ts and jean-server/utils/festiveGreeting.js.
 *
 * The server prints the same block on ESC/POS receipts; keep the season and
 * the wording below in step with jean-server/utils/festiveGreeting.js.
 */

export const FESTIVE_TIMEZONE = "Africa/Lubumbashi";

/** Inclusive business dates (YYYY-MM-DD) during which the greeting is shown. */
export const FESTIVE_SEASON = { start: "2026-11-10", end: "2027-01-15" } as const;

/** Exact wording, in French, regardless of the interface language. */
export const FESTIVE_LINES = {
  title: "★ JOYEUX NOËL ★",
  subtitle: "ET BONNE ANNÉE !",
  wishes: "Nos meilleurs vœux",
  year: "2027",
  message: "Que cette nouvelle année vous apporte joie, santé et prospérité !",
} as const;

const businessDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: FESTIVE_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Business date ("YYYY-MM-DD") of an instant, in the store's timezone. */
export function festiveBusinessDate(now: Date): string {
  const parts = businessDayFormatter.formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function isFestiveSeason(now: Date = new Date()): boolean {
  if (Number.isNaN(now.getTime())) return false;
  const day = festiveBusinessDate(now);
  return day >= FESTIVE_SEASON.start && day <= FESTIVE_SEASON.end;
}

/**
 * Styles for the greeting block. Scoped to `.festive-greeting` so they cannot
 * affect the rest of the receipt. Black on white only, no backgrounds, sized
 * for the 72mm printable width of 80mm paper.
 */
export const FESTIVE_GREETING_CSS = `
      .festive-greeting {
        margin: 2mm auto 1mm;
        padding: 1.5mm 1mm;
        max-width: 72mm;
        text-align: center;
        color: #000;
        background: transparent;
        border-top: 1px dashed #000;
        border-bottom: 1px dashed #000;
        overflow-wrap: break-word;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      /* The greeting already closes with a dashed rule: avoid doubling it. */
      .festive-greeting + .footer {
        border-top: none;
      }
      .festive-greeting .festive-title {
        font-size: 12px;
        font-weight: bold;
        letter-spacing: 0.5px;
        line-height: 1.3;
      }
      .festive-greeting .festive-subtitle {
        font-size: 11px;
        font-weight: bold;
        line-height: 1.3;
      }
      .festive-greeting .festive-rule {
        width: 24mm;
        margin: 1mm auto;
        border-top: 1px solid #000;
      }
      .festive-greeting .festive-wishes {
        font-size: 10px;
        font-weight: bold;
        line-height: 1.3;
      }
      .festive-greeting .festive-year {
        font-size: 24px;
        font-weight: 900;
        letter-spacing: 3px;
        line-height: 1.15;
        margin: 0.5mm 0;
      }
      .festive-greeting .festive-message {
        font-size: 9.5px;
        font-weight: bold;
        line-height: 1.3;
        margin: 0 auto;
        max-width: 64mm;
      }
`;

/**
 * Greeting markup to insert after the payment information and before the
 * receipt footer. Returns an empty string outside the festive season.
 */
export function festiveGreetingHtml(now: Date = new Date()): string {
  if (!isFestiveSeason(now)) return "";
  return `
      <div class="festive-greeting" lang="fr">
        <div class="festive-title">${FESTIVE_LINES.title}</div>
        <div class="festive-subtitle">${FESTIVE_LINES.subtitle}</div>
        <div class="festive-rule"></div>
        <div class="festive-wishes">${FESTIVE_LINES.wishes}</div>
        <div class="festive-year">${FESTIVE_LINES.year}</div>
        <div class="festive-message">${FESTIVE_LINES.message}</div>
      </div>
`;
}
