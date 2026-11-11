import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FESTIVE_GREETING_CSS,
  FESTIVE_LINES,
  FESTIVE_SEASON,
  festiveGreetingHtml,
  isFestiveSeason,
} from "../src/utils/festiveGreeting.ts";

test("festive season follows the Lubumbashi business calendar (UTC+2)", () => {
  assert.deepEqual({ ...FESTIVE_SEASON }, { start: "2026-11-10", end: "2027-01-15" });
  assert.equal(isFestiveSeason(new Date("2026-11-09T21:59:59Z")), false);
  assert.equal(isFestiveSeason(new Date("2026-11-09T22:00:00Z")), true);
  assert.equal(isFestiveSeason(new Date("2027-01-15T21:59:59Z")), true);
  assert.equal(isFestiveSeason(new Date("2027-01-15T22:00:00Z")), false);
  assert.equal(isFestiveSeason(new Date("invalid")), false);
});

test("greeting carries the exact French wording, in reading order", () => {
  const html = festiveGreetingHtml(new Date("2026-12-24T10:00:00Z"));
  const order = [FESTIVE_LINES.title, FESTIVE_LINES.subtitle, FESTIVE_LINES.wishes, FESTIVE_LINES.year, FESTIVE_LINES.message]
    .map((line) => html.indexOf(line));
  assert.ok(order.every((index, i) => index > 0 && (i === 0 || index > order[i - 1])));
  assert.equal(FESTIVE_LINES.title, "★ JOYEUX NOËL ★".normalize("NFC"));
  assert.equal(FESTIVE_LINES.subtitle, "ET BONNE ANNÉE !".normalize("NFC"));
  assert.equal(FESTIVE_LINES.wishes, "Nos meilleurs vœux");
  assert.match(FESTIVE_GREETING_CSS, /\.festive-year \{[^}]*font-size: 24px;[^}]*font-weight: 900;/);
  assert.match(FESTIVE_GREETING_CSS, /text-align: center;/);
});

test("greeting is absent outside the season", () => {
  assert.equal(festiveGreetingHtml(new Date("2027-01-16T10:00:00Z")), "");
  assert.equal(festiveGreetingHtml(new Date("2026-11-01T10:00:00Z")), "");
});

const receipts = [
  "src/pages/NewSale.tsx",
  "src/pages/history/SalesHistory.tsx",
  "src/pages/Entry.tsx",
  "src/pages/EntryHistory.tsx",
  "src/pages/SortieHistory.tsx",
];

test("each 80mm receipt places the greeting after payment details and before its footer", () => {
  for (const file of receipts) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.equal(source.match(/\$\{festiveGreetingHtml\(\)\}/g)?.length, 1, `${file}: one greeting`);
    assert.equal(source.match(/\$\{FESTIVE_GREETING_CSS\}/g)?.length, 1, `${file}: one style block`);
    const greeting = source.indexOf("${festiveGreetingHtml()}");
    assert.ok(source.lastIndexOf("aymentMethod", greeting) > 0, `${file}: payment shown before greeting`);
    const footer = source.indexOf('<div class="footer">', greeting);
    assert.ok(footer > greeting && footer - greeting < 120, `${file}: footer follows greeting`);
  }
});
