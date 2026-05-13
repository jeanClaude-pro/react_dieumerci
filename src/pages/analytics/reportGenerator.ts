/* eslint-disable @typescript-eslint/no-explicit-any */
import jsPDF from 'jspdf';
import { formatNowGMT2 } from '../../utils/dateUtils';

// ── Minimal types (mirrors Analytics.tsx, no import needed) ─────────────────

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

interface ReportAnalytics {
  totalSales: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  totalValidatedExpenses: number;
  totalEntries: number;
  netRevenue: number;
  topProducts: TopProduct[];
  recentTrends: {
    salesGrowth: number;
    revenueGrowth: number;
    customerGrowth: number;
  };
}

export interface ReportSections {
  financial: boolean;
  sales: boolean;
  products: boolean;
  clients: boolean;
  expenses: boolean;
  entries: boolean;
}

export interface ReportConfig {
  sections: ReportSections;
  analytics: ReportAnalytics;
  adminUsername: string;
  adminSignatureText: string;
  hasSignature: boolean;
  hasStamp: boolean;
  timeframeLabel: string;
  formatCurrency: (n: number) => string;
}

// ── Layout constants ─────────────────────────────────────────────────────────

const COMPANY      = 'ETS. DIEU MERCI';
const COMPANY_SUB  = 'Gestion de Vente';
const PW           = 210;   // A4 width  mm
const PH           = 297;   // A4 height mm
const M            = 18;    // page margin
const CW           = PW - M * 2;           // content width
const HDR_BOTTOM   = M + 10;               // running header bottom edge
const FTR_TOP      = PH - M - 8;           // running footer top edge
const CT           = HDR_BOTTOM + 5;       // content top
const CB           = FTR_TOP - 4;          // content bottom (before footer)

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Draw the running page header (all pages except cover). */
function drawHeader(doc: jsPDF, reportTitle: string): void {
  doc.setFillColor(15, 48, 99);
  doc.rect(0, 0, PW, HDR_BOTTOM, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(COMPANY, M, HDR_BOTTOM - 3);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(reportTitle, PW - M, HDR_BOTTOM - 3, { align: 'right' });
  doc.setTextColor(31, 41, 55);
}

/** Draw the running page footer. */
function drawFooter(doc: jsPDF, page: number, total: number, genAt: string): void {
  doc.setDrawColor(203, 213, 225);
  doc.line(M, FTR_TOP, PW - M, FTR_TOP);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Généré le ${genAt}`, M, FTR_TOP + 4.5);
  doc.text(`Page ${page} / ${total}`, PW - M, FTR_TOP + 4.5, { align: 'right' });
  doc.text(`${COMPANY} — ${COMPANY_SUB}`, PW / 2, FTR_TOP + 4.5, { align: 'center' });
  doc.setTextColor(31, 41, 55);
}

/** Draw a dark-blue section title bar, returns Y after the bar + gap. */
function sectionBar(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(15, 48, 99);
  doc.rect(M, y, CW, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(title, M + 4, y + 6.3);
  doc.setTextColor(31, 41, 55);
  return y + 13; // 9 bar + 4 gap
}

/** Draw a light info band (blue-tinted), returns Y after band + gap. */
function infoBand(doc: jsPDF, text: string, y: number): number {
  doc.setFillColor(219, 234, 254);
  doc.rect(M, y, CW, 12, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(text, M + 4, y + 7.5);
  return y + 16;
}

/**
 * Draw a 2-column or 3-column grid of metric cards.
 * Returns Y after the last row + gap.
 */
function metricGrid(
  doc: jsPDF,
  items: { label: string; value: string; note?: string }[],
  y: number,
  cols = 3,
): number {
  const cardH = 20;
  const gap   = 3;
  const colW  = CW / cols;

  items.forEach((item, idx) => {
    const col  = idx % cols;
    const row  = Math.floor(idx / cols);
    const x    = M + col * colW;
    const cy   = y + row * (cardH + gap);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.rect(x + 1, cy, colW - 2, cardH, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text(item.label, x + 4, cy + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(item.value, x + 4, cy + 13);

    if (item.note) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(107, 114, 128);
      doc.text(item.note, x + 4, cy + 18.5);
    }
  });

  const rows = Math.ceil(items.length / cols);
  return y + rows * (cardH + gap) + 4;
}

/**
 * Draw a simple striped table, adding pages as needed.
 * Returns Y after the table + gap.
 */
function dataTable(
  doc: jsPDF,
  headers: string[],
  rows: string[][],
  x: number,
  y: number,
  widths: number[],
  rowH = 7.5,
  onPageBreak?: () => void,
): number {
  const tw = widths.reduce((a, b) => a + b, 0);

  const drawTableHeader = (hy: number): void => {
    doc.setFillColor(15, 48, 99);
    doc.rect(x, hy, tw, rowH, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);

    let hx = x;
    headers.forEach((h, i) => {
      doc.text(h, hx + 2.5, hy + rowH - 2.3);
      hx += widths[i];
    });
  };

  let pageStartY = y;
  drawTableHeader(pageStartY);
  let ry = y + rowH;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  for (let ri = 0; ri < rows.length; ri++) {
    if (ry + rowH > CB) {
      doc.setDrawColor(203, 213, 225);
      doc.rect(x, pageStartY, tw, ry - pageStartY, 'S');

      if (!onPageBreak) break;

      onPageBreak();
      pageStartY = CT;
      drawTableHeader(pageStartY);
      ry = pageStartY + rowH;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }

    if (ri % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(x, ry, tw, rowH, 'F');
    }

    doc.setTextColor(31, 41, 55);
    let cx = x;
    rows[ri].forEach((cell, ci) => {
      // Truncate to fit column width (≈ 2.1 chars per mm for 8pt helvetica)
      const maxChars = Math.max(4, Math.floor(widths[ci] / 2.1));
      const t = cell.length > maxChars ? cell.substring(0, maxChars - 1) + '…' : cell;
      doc.text(t, cx + 2.5, ry + rowH - 2.3);
      cx += widths[ci];
    });

    doc.setDrawColor(226, 232, 240);
    doc.line(x, ry + rowH, x + tw, ry + rowH);
    ry += rowH;
  }

  doc.setDrawColor(203, 213, 225);
  doc.rect(x, pageStartY, tw, ry - pageStartY, 'S');
  return ry + 3;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function generateCompanyReport(config: ReportConfig): void {
  const {
    analytics, sections, adminUsername, adminSignatureText,
    hasSignature, hasStamp, timeframeLabel, formatCurrency,
  } = config;

  const doc    = new (jsPDF as any)({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const genAt  = formatNowGMT2();
  const official = hasSignature && hasStamp;

  // Section names for display
  const secNames: string[] = [];
  if (sections.financial) secNames.push('Résumé Financier');
  if (sections.sales)     secNames.push('Ventes');
  if (sections.products)  secNames.push('Produits');
  if (sections.clients)   secNames.push('Clients');
  if (sections.expenses)  secNames.push('Dépenses');
  if (sections.entries)   secNames.push('Entrées');

  const allSelected  = Object.values(sections).every(Boolean);
  const reportTitle  = allSelected
    ? 'Rapport Complet d\'Entreprise'
    : secNames.length === 1
      ? secNames[0]
      : 'Rapport Sélectif';

  // ── COVER PAGE ────────────────────────────────────────────────────────────
  // Dark-blue header block
  doc.setFillColor(15, 48, 99);
  doc.rect(0, 0, PW, 82, 'F');
  // Accent stripe
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 80, PW, 4, 'F');

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text(COMPANY, PW / 2, 34, { align: 'center' });

  // Company subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(147, 197, 253);
  doc.text(COMPANY_SUB, PW / 2, 43, { align: 'center' });

  // Report title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(255, 255, 255);
  doc.text(reportTitle.toUpperCase(), PW / 2, 58, { align: 'center' });

  // Period
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(147, 197, 253);
  doc.text(`Période: ${timeframeLabel}`, PW / 2, 67, { align: 'center' });

  // ── Meta info card ──────────────────────────────────────────────────────
  const mY = 94;
  doc.setFillColor(219, 234, 254);
  doc.setDrawColor(37, 99, 235);
  doc.rect(M, mY, CW, 44, 'FD');

  const metaRows: [string, string][] = [
    ['Généré le:', genAt],
    ['Généré par:', adminUsername],
    ['Sections:', secNames.join(', ') || 'Aucune sélectionnée'],
    ['Statut:', official ? '✓ Document Officiel' : '⚠ Document Non Officiel'],
  ];

  metaRows.forEach(([label, value], i) => {
    const ly = mY + 9 + i * 9;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(label, M + 5, ly);

    doc.setFont('helvetica', 'normal');
    if (i === 3) {
      // Status row — green for official, red for unofficial
      doc.setTextColor(official ? 22 : 185, official ? 163 : 28, official ? 74 : 26);
    }
    const lines = doc.splitTextToSize(value, CW - 48);
    doc.text(lines[0] ?? '', M + 44, ly);
    doc.setTextColor(15, 23, 42);
  });

  // ── Cover unofficial warning ───────────────────────────────────────────
  if (!official) {
    const wY = mY + 50;
    doc.setFillColor(220, 38, 38);
    doc.rect(M, wY, CW, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('⚠  DOCUMENT NON OFFICIEL', M + 4, wY + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const missing = !hasSignature && !hasStamp
      ? 'Ce rapport ne contient ni signature autorisée ni cachet officiel de l\'entreprise.'
      : !hasSignature
        ? 'Ce rapport ne contient pas de signature administrateur autorisée.'
        : 'Ce rapport ne contient pas de cachet officiel de l\'entreprise.';
    const warnLines = doc.splitTextToSize(missing, CW - 8);
    doc.text(warnLines, M + 4, wY + 15);
  }

  // ── CONTENT PAGES ────────────────────────────────────────────────────────
  let Y = CT;
  let secNum = 0;

  function newPage(): void {
    doc.addPage();
    drawHeader(doc, reportTitle);
    Y = CT;
  }

  /** Ensure at least `need` mm is available; add new page if not. */
  function ensure(need: number): void {
    if (Y + need > CB) newPage();
  }

  newPage();

  // ── Financial Summary ──────────────────────────────────────────────────
  if (sections.financial) {
    secNum++;
    ensure(90);
    Y = sectionBar(doc, `${secNum}. Résumé Financier`, Y);

    Y = metricGrid(doc, [
      { label: 'Ventes Totales',       value: String(analytics.totalSales),                        note: 'Transactions complétées' },
      { label: 'Revenu Total',          value: formatCurrency(analytics.totalRevenue),               note: 'Revenu des ventes' },
      { label: 'Entrées de Caisse',     value: formatCurrency(analytics.totalEntries),               note: 'Montant total reçu' },
      { label: 'Dépenses Validées',     value: formatCurrency(analytics.totalValidatedExpenses),     note: 'Montant total validé' },
      { label: 'Revenu Net',            value: formatCurrency(analytics.netRevenue),                 note: '(Ventes + Entrées) - Dépenses' },
      { label: 'Clients Uniques',       value: String(analytics.totalCustomers),                     note: 'Dans la période' },
    ], Y, 3);
  }

  // ── Sales ──────────────────────────────────────────────────────────────
  if (sections.sales) {
    ensure(36);
    secNum++;
    Y = sectionBar(doc, `${secNum}. Rapport de Ventes`, Y);

    const trend = analytics.recentTrends.revenueGrowth;
    Y = infoBand(
      doc,
      `Ventes: ${analytics.totalSales}  |  Revenu: ${formatCurrency(analytics.totalRevenue)}  |  Clients: ${analytics.totalCustomers}  |  Tendance: ${trend >= 0 ? '+' : ''}${trend}%`,
      Y,
    );
  }

  // ── Products ───────────────────────────────────────────────────────────
  if (sections.products) {
    ensure(40);
    secNum++;
    Y = sectionBar(doc, `${secNum}. Rapport des Produits`, Y);

    if (analytics.topProducts.length > 0) {
      Y = dataTable(
        doc,
        ['#', 'Article', 'Qté', 'Revenu'],
        analytics.topProducts.map((p, i) => [
          String(i + 1),
          p.name,
          `${p.quantity} u.`,
          formatCurrency(p.revenue),
        ]),
        M, Y,
        [12, 92, 34, 32],
        7.5,
        () => {
          doc.addPage();
          drawHeader(doc, reportTitle);
        },
      );
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(107, 114, 128);
      doc.text('Aucun produit vendu dans cette période.', M + 4, Y + 7);
      Y += 14;
    }
  }

  // ── Clients ────────────────────────────────────────────────────────────
  if (sections.clients) {
    ensure(32);
    secNum++;
    Y = sectionBar(doc, `${secNum}. Rapport Clients`, Y);
    const ct = analytics.recentTrends.customerGrowth;
    Y = infoBand(
      doc,
      `Clients actifs dans la période: ${analytics.totalCustomers}  |  Tendance: ${ct >= 0 ? '+' : ''}${ct}%`,
      Y,
    );
  }

  // ── Expenses ───────────────────────────────────────────────────────────
  if (sections.expenses) {
    ensure(32);
    secNum++;
    Y = sectionBar(doc, `${secNum}. Rapport des Dépenses`, Y);
    Y = infoBand(doc, `Dépenses validées: ${formatCurrency(analytics.totalValidatedExpenses)}`, Y);
  }

  // ── Entries ────────────────────────────────────────────────────────────
  if (sections.entries) {
    ensure(32);
    secNum++;
    Y = sectionBar(doc, `${secNum}. Rapport d'Entrées de Caisse`, Y);
    Y = infoBand(doc, `Entrées de caisse totales: ${formatCurrency(analytics.totalEntries)}`, Y);
  }

  // ── SIGNATURE / CERTIFICATION PAGE ────────────────────────────────────
  ensure(120);
  Y = sectionBar(doc, 'Certification & Signature Officielle', Y);

  // Signature box (left)
  const sigW = CW / 2 - 3;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(M, Y, sigW, 52, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Signature Administrateur', M + 4, Y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(55, 65, 81);
  doc.text(`Nom: ${adminUsername}`, M + 4, Y + 16);
  if (adminSignatureText) {
    doc.text(`Titre: ${adminSignatureText}`, M + 4, Y + 23);
  }
  // Signature line
  doc.setDrawColor(120, 130, 150);
  doc.line(M + 4, Y + 44, M + sigW - 6, Y + 44);
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.text('Signature autorisée', M + 4, Y + 49);

  if (!hasSignature) {
    doc.setTextColor(185, 28, 28);
    doc.setFontSize(7.5);
    doc.text('⚠ Signature manquante', M + 4, Y + 56);
  }

  // Stamp box (right)
  const stX = M + CW / 2 + 3;
  const stW = CW / 2 - 3;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(stX, Y, stW, 52, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Cachet Officiel', stX + 4, Y + 8);

  // Stamp circle placeholder
  const eCx = stX + stW / 2;
  const eCy = Y + 32;
  doc.setDrawColor(150, 170, 210);
  doc.setFillColor(240, 244, 255);
  doc.ellipse(eCx, eCy, 15, 15, 'FD');
  doc.setDrawColor(130, 155, 200);
  doc.ellipse(eCx, eCy, 12, 12, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 120, 170);
  doc.text('CACHET', eCx, eCy - 2, { align: 'center' });
  doc.text('OFFICIEL', eCx, eCy + 3.5, { align: 'center' });
  doc.setFontSize(5.5);
  doc.text(COMPANY, eCx, eCy + 9, { align: 'center' });

  if (!hasStamp) {
    doc.setTextColor(185, 28, 28);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('⚠ Cachet manquant', stX + 4, Y + 56);
  }

  Y += 62;

  // ── Certification banner ───────────────────────────────────────────────
  if (official) {
    doc.setFillColor(22, 163, 74);
    doc.rect(M, Y, CW, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const okMsg = doc.splitTextToSize(
      '✓  DOCUMENT OFFICIELLEMENT VALIDÉ — Signé et tamponné par un administrateur autorisé.',
      CW - 8,
    );
    doc.text(okMsg, M + 4, Y + 9);
    Y += 18;
  } else {
    doc.setFillColor(220, 38, 38);
    doc.rect(M, Y, CW, 26, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('⚠  DOCUMENT NON OFFICIEL', M + 4, Y + 9);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const warnLines = doc.splitTextToSize(
      'Ce rapport n\'est pas officiellement validé car il ne contient pas de signature administrateur autorisée et/ou de cachet officiel de l\'entreprise.',
      CW - 8,
    );
    doc.text(warnLines, M + 4, Y + 17);
    Y += 30;
  }

  // Generation attribution line
  Y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(107, 114, 128);
  doc.text(
    `Rapport généré le ${genAt} par ${adminUsername} — ${COMPANY} ${COMPANY_SUB}`,
    PW / 2, Y, { align: 'center' },
  );

  // ── Apply footers to all content pages (skip cover = page 1) ──────────
  const totalPgs = doc.getNumberOfPages();
  for (let p = 2; p <= totalPgs; p++) {
    doc.setPage(p);
    drawFooter(doc, p - 1, totalPgs - 1, genAt);
  }

  // ── Save ──────────────────────────────────────────────────────────────
  const dateStamp = new Date().toISOString().split('T')[0];
  doc.save(`rapport-ets-dieu-merci-${dateStamp}.pdf`);
}
