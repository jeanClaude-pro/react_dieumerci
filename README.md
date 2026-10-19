# ETS. DIEU MERCI — web app (`jean-client`)

React 19 + TypeScript + Vite 7 interface for ETS. DIEU MERCI (Lubumbashi): point of sale, receipts with
secure QR codes, stock, cash in / cash out, debts, exchange rate, dashboard, reports and the audit log.
Works on phones, tablets and desktops, as an installable PWA, in **French (default) and English**.

---

## 1. Requirements

- Node.js 22 or newer
- The API (`jean-server`) running and reachable

## 2. Install and run

```bash
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:5000/api
npm run dev                   # http://localhost:5173
```

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | API base URL, ending in `/api`. A production build refuses anything other than `https://`. |

## 3. Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Type check (`tsc -b`) then production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint (must stay at 0 errors / 0 warnings) |
| `npm test` | Unit and architecture tests (`node --test`, includes the translation key checks) |
| `npm run test:component` | Component tests (Vitest + Testing Library) |

Deployment: `netlify.toml` redirects every route to `index.html` (single-page app).

## 4. Project layout

```
src/
  App.tsx                    routes, lazy pages, role guards (RequireAuth / RequireRole)
  config/navigation.ts       menu, roles per page (mirrors the server access policy)
  i18n/                      translations (see §6)
  styles/system.css          design system: Forest Green + Ivory + Charcoal tokens and shared patterns
  index.css                  Tailwind 4 theme and base components (cards, buttons, tables, dialogs)
  components/
    finance/                 TrendChart (Recharts) and FinancialTrend for the reports page
    inventory/               period picker, stock card, stock movements, charts
    ui/                      Dialog, ResponsiveTable, PageHeader, States, LanguageToggle, …
  pages/                     one folder or file per screen
  utils/                     pricing, formatting, receipt scanning, stock helpers
test/                        node tests (*.test.ts) and component tests (*.vitest.test.tsx)
```

## 5. Screens

| Screen | Who | Notes |
|---|---|---|
| New sale (`/new-sale`) | sales roles | Cart in USD or FC, walk-in or registered customer, receipt + stub with QR |
| Payment approval / exit control | supervisors | Scan the receipt QR (USB reader or camera) |
| Sales, entries, expenses history | sales roles | Search, period picker, reprint, edit with reason, admin summaries |
| Products (`/products`) | admin, manager, stock | Catalogue, stock levels and availability (no prices: every price is typed at the till) |
| Dashboard (`/dashboard`) | admin | Opening / closing stock, and per sold item a plain-language story: what it started with, what came in, what was sold, what is left |
| Reports (`/reports`) | admin (password re-check) | Trend chart from zero (revenue, money in, validated expenses, net cash) with peak / lowest / average marks, any calendar month, KPIs, “(sales + money in) − validated expenses = net cash”, best products and customers, PDF report |
| Audit log (`/audit`) | admin | Every user action; suspicious ones in red, with the reason and a review note |
| Exchange rate (`/rate`) | admin, manager | Warns when the new rate moves 10 % or more |
| Administration (`/admin`) | admin | Accounts, roles, page and action permissions, receipt settings |

The menu only hides what a role cannot use. **The server checks every request again** — a user who forces a URL
or calls the API directly is refused and the attempt is recorded in the audit log.

## 6. Languages (FR / EN)

- `i18next` + `react-i18next`; files: `src/i18n/locales/fr.json` and `en.json` (same keys, checked by
  `test/i18nKeys.test.ts`).
- **French is the default.** The FR / EN switch is in the sidebar footer, the mobile “More” sheet, the top bar of
  the home page and the login page. The change is instant (no reload, typed data is kept) and remembered on the
  device (`localStorage` key `ui.language`).
- Use `useTranslation()` in components and `tr(key, frenchFallback)` (`src/i18n/translate.ts`) in plain modules.
- Formatting: `src/i18n/format.ts`. USD amounts are always written `$1,234.56`; FC amounts and dates follow the
  language.
- Server messages are translated by `src/i18n/serverMessages.ts` (known messages → current language).
- Database values never change with the language: entry sources / categories, payment methods and statuses are
  stored as before and only their label is translated (`src/utils/entryLabels.ts`).
- Receipts, stubs and PDFs are printed in the language in use.

To add a text: add the key to **both** JSON files, use `t("area.key")`, then run `npm test`.

## 7. Design system

Forest Green `#1f7a4d` / `#24613f`, Ivory `#f7f5ef` (cards `#fffdf9`), Charcoal `#18201b`. Tokens are in
`src/styles/system.css`; reuse its patterns (`kpi`, `report-table`, `dialog-panel`, `form-section`, `form-row`,
`segmented`) instead of one-off styles. Tables switch to cards on narrow screens (`ResponsiveTable`), and row
actions stay pinned on the right when a wide table scrolls.

## 8. Notes

- `src/pages/pos/Pos.tsx` is an older POS screen that is no longer routed; the live screen is `pages/NewSale.tsx`.
- Products have no purchase or selling price to manage: prices are typed in New sale for each sale.
