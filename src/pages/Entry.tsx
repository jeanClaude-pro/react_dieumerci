import React, { useEffect, useState, useRef } from "react";
import PageHeader from "../components/ui/PageHeader";
import ExchangeRateChip from "../components/ui/ExchangeRateChip";
import { formatNowGMT2 } from "../utils/dateUtils";
import { useAuth } from "../hooks/useAuth";
import { AlertTriangle, CheckCircle2, CircleArrowDown, DollarSign, RefreshCw, FileText, User, Calculator } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatFC, formatUSD } from "../i18n/format";
import { activeLocale } from "../i18n/translate";
import { serverMessage } from "../i18n/serverMessages";
import { entryCategoryLabel, entrySourceLabel, uiPaymentLabel } from "../utils/entryLabels";
import { serverUrl } from "../utils/constants";
import { createAmountSnapshot } from "../utils/salePricing";
import { apiRequest } from "../lib/api";
import { FESTIVE_GREETING_CSS, festiveGreetingHtml } from "../utils/festiveGreeting";
import { printAndClose } from "../utils/printWindow";

interface Entry {
  _id: string;
  entryId: string;
  amount: number;
  source: string;
  category: string;
  paymentMethod: string;
  description: string;
  receivedFrom: {
    name: string;
    phone: string;
    email: string;
  };
  createdBy: {
    _id: string;
    username: string;
  };
  createdAt: string;
  status: string;
}

interface EntryReceiptData {
  shopName: string;
  shopAddress: string;
  shopNumber: string;
  shopRegistration: string;
  date: string;
  amount: number;
  enteredAmount: number;
  enteredCurrency: "USD" | "FC";
  amountUSD: number;
  source: string;
  category: string;
  paymentMethod: string;
  description: string;
  receivedFrom: { name: string; phone: string; email: string };
  agent: string;
  receiptNumber: string;
  stubNumber: string;
  exchangeRate?: number;
}

interface ExchangeRate {
  rate: number;
  effectiveFrom: string;
  lastUpdated: string;
}

const API_BASE = serverUrl;

type UiPayment = "cash" | "mpesa" | "card" | "bank" | "other";

// Payment method normalization function (matches your route)
function uiToModelPayment(pm: UiPayment): "cash" | "card" | "transfer" | "other" {
  if (pm === "cash") return "cash";
  if (pm === "card") return "card";
  if (pm === "mpesa" || pm === "bank") return "transfer";
  return "other";
}

// User-typed text is written into the print window as HTML
function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Safe JSON parser to handle HTML errors
async function readJsonSafe(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  const text = await res.text();
  return { __nonJson: true, text };
}

export default function Entry() {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [receiptData, setReceiptData] = useState<EntryReceiptData | null>(null);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [loadingRate, setLoadingRate] = useState(true);
  const receiptRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);

  const { user: currentUser } = useAuth();

  const [form, setForm] = useState({
    amount: "",
    amountInFC: "",
    source: "",
    category: "",
    paymentMethod: "cash" as UiPayment,
    description: "",
    receivedFromName: "",
    receivedFromPhone: "",
    receivedFromEmail: "",
    currencyMode: "usd" as "usd" | "fc"
  });

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sources prédéfinies
  const sources = [
    "Paiement Client",
    "Dépôt Bancaire",
    "Reçu d'Espèces",
    "Remboursement Prêt",
    "Investissement",
    "Revenue Divers",
    "Transfert Mobile",
    "Autre Source"
  ];

  // Catégories prédéfinies
  const categories = [
    "Revenue Ventes",
    "Dépôt Espèces",
    "Remboursement",
    "Prêt",
    "Investissement",
    "Revenue Divers",
    "Autre Catégorie"
  ];

  // Load exchange rate
  const loadExchangeRate = async () => {
    try {
      setLoadingRate(true);
      const response = await fetch(`${API_BASE}/exchange-rates/current`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setExchangeRate(data);
      } else {
        console.warn('Failed to load exchange rate');
      }
    } catch (error) {
      console.error('Error loading exchange rate:', error);
    } finally {
      setLoadingRate(false);
    }
  };

  useEffect(() => {
    loadExchangeRate();
  }, []);

  // Calculate USD amount when FC amount changes
  useEffect(() => {
    if (form.currencyMode === "fc" && form.amountInFC && exchangeRate) {
      const fcAmount = parseFloat(form.amountInFC) || 0;
      const usdAmount = fcAmount / exchangeRate.rate;
      setForm(prev => ({
        ...prev,
        amount: usdAmount.toFixed(2)
      }));
    }
  }, [form.amountInFC, form.currencyMode, exchangeRate]);

  // Calculate FC amount when USD amount changes
  useEffect(() => {
    if (form.currencyMode === "usd" && form.amount && exchangeRate) {
      const usdAmount = parseFloat(form.amount) || 0;
      const fcAmount = usdAmount * exchangeRate.rate;
      setForm(prev => ({
        ...prev,
        amountInFC: Math.round(fcAmount).toString()
      }));
    }
  }, [form.amount, form.currencyMode, exchangeRate]);

  const enteredAmount = Number(form.currencyMode === "fc" ? form.amountInFC : form.amount);
  const isFormValid =
    Number.isFinite(enteredAmount) && enteredAmount > 0 &&
    (form.currencyMode !== "fc" || (Number.isFinite(exchangeRate?.rate) && (exchangeRate?.rate ?? 0) > 0)) &&
    form.source.trim() !== "" && 
    form.category.trim() !== "" && 
    form.receivedFromName.trim() !== "" &&
    form.receivedFromPhone.trim() !== "";

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  // Toggle between USD and FC input modes
  const toggleCurrencyMode = () => {
    setForm(prev => ({
      ...prev,
      currencyMode: prev.currencyMode === "usd" ? "fc" : "usd",
      amount: "",
      amountInFC: ""
    }));
  };

  const formatFc = (amount: number) => formatFC(amount);
  const formatCurrency = (amount: number) => formatUSD(amount);
  // Printed labels (receipt and stub follow the interface language).
  const L = (key: string) => escapeHtml(t(`receipt.${key}`));
  const enteredAmountText = (data: EntryReceiptData) => data.enteredCurrency === "FC"
    ? `${data.enteredAmount.toLocaleString(activeLocale())} FC`
    : `$${data.enteredAmount.toFixed(2)}`;

  // Print function for entry receipt only
  const printReceiptOnly = () => {
    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (printWindow && receiptData) {
      printWindow.document.write(`
<html>
  <head>
    <title>${L("entryReceiptTitle")}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body { 
        font-family: 'Courier New', Courier, monospace; 
        margin: 0; 
        padding: 0; 
        font-size: 13px;
        font-weight: bold;
        line-height: 1.1;
        width: 72mm;
        background-color: white;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        display: flex;
        justify-content: center;
      }
      .receipt-container { 
        width: 70mm;
        margin: 0 auto;
        padding: 0.5mm;
        border: none;
        text-align: center;
      }
      .header { 
        text-align: center; 
        margin-bottom: 1mm; 
        padding-bottom: 1mm;
        border-bottom: 2px double #000;
      }
      .shop-name {
        font-size: 15px;
        font-weight: bold;
        margin-bottom: 0.5mm;
        text-transform: uppercase;
      }
      .shop-details {
        font-size: 11px;
        margin-bottom: 0.3mm;
        line-height: 1;
        font-weight: bold;
      }
      .receipt-info {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #f8f8f8;
        border-left: 3px solid #000;
      }
      .receipt-title {
        font-size: 13px;
        font-weight: bold;
        margin: 1mm 0;
        text-transform: uppercase;
        background-color: #000;
        color: white;
        padding: 1mm;
        border-radius: 2px;
      }
      .entry-badge {
        background-color: #000;
        color: white;
        padding: 2mm;
        font-weight: bold;
        text-align: center;
        margin: 1mm 0;
        font-size: 14px;
        border-radius: 3px;
      }
      .details-section {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #fafafa;
        border: 1px solid #eee;
      }
      .detail-row { 
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5mm;
        padding: 0 1mm;
        border-bottom: 1px dotted #ddd;
      }
      .detail-label {
        text-align: left;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .detail-value {
        text-align: right;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .amount-section { 
        font-weight: bold; 
        margin-top: 1mm;
        padding: 1mm;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .amount-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.3mm;
        font-size: 13px;
        padding: 0 1mm;
      }
      .payment-method {
        text-transform: uppercase;
        font-weight: bold;
        font-size: 13px;
        color: #000;
      }
      .footer { 
        text-align: center; 
        margin-top: 1mm; 
        font-size: 11px;
        font-weight: bold;
        padding: 1mm;
        background-color: #f8f8f8;
        border-top: 1px dashed #000;
      }
      .agent-info {
        margin-top: 1mm;
        text-align: center;
        font-weight: bold;
        font-size: 12px;
        padding: 1mm;
        background-color: #e8e8e8;
        border: 1px solid #ccc;
        border-radius: 2px;
      }
      .sender-info {
        margin: 1mm 0;
        padding: 1mm;
        font-weight: bold;
        text-align: center;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .sender-field {
        margin-bottom: 0.3mm;
        font-size: 12px;
      }
      .separator {
        border-top: 1px dashed #000;
        margin: 1mm 0;
      }
      .cut-line {
        text-align: center;
        margin: 1mm 0;
        font-weight: bold;
        font-size: 11px;
        color: #000;
        letter-spacing: 1px;
      }
      .thank-you {
        font-weight: bold;
        margin: 0.5mm 0;
        font-size: 12px;
      }
      .warning {
        font-size: 10px;
        color: #000;
        margin: 0.3mm 0;
        font-weight: bold;
      }
      .description {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #f5f5f5;
        border-left: 3px solid #ccc;
        font-size: 11px;
        font-weight: bold;
        border-radius: 2px;
      }
      .section-divider {
        height: 2px;
        background: linear-gradient(to right, transparent, #000, transparent);
        margin: 1mm 0;
      }
      @media print {
        @page {
          margin: 0 !important;
          size: 72mm auto !important;
        }
        body { 
          margin: 0 !important; 
          padding: 0 !important; 
          width: 72mm !important;
          font-size: 13px !important;
          background: white !important;
          font-weight: bold !important;
          height: auto !important;
          overflow: hidden !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          display: flex !important;
          justify-content: center !important;
        }
        .receipt-container { 
          border: none !important; 
          box-shadow: none !important; 
          margin: 0 auto !important;
          padding: 0.5mm !important;
          width: 70mm !important;
          page-break-after: avoid !important;
          page-break-inside: avoid !important;
        }
        .cut-line {
          page-break-after: always !important;
          margin-bottom: 0 !important;
        }
        body::after,
        body::before {
          display: none !important;
          content: none !important;
        }
      }
    ${FESTIVE_GREETING_CSS}
    </style>
  </head>
  <body>
    <div class="receipt-container">
      <div class="header">
        <div class="shop-name"><strong>${escapeHtml(receiptData.shopName)}</strong></div>
        <div class="shop-details"><strong>${escapeHtml(receiptData.shopAddress)}</strong></div>
        <div class="shop-details">${L("tel")}: <strong>${escapeHtml(receiptData.shopNumber)}</strong></div>
        <div class="shop-details"><strong>${escapeHtml(receiptData.shopRegistration)}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">${L("date")}: <strong>${escapeHtml(receiptData.date)}</strong></div>
        <div class="shop-details">${L("receiptNo")}: <strong>${escapeHtml(receiptData.receiptNumber)}</strong></div>
      </div>
      
      <div class="entry-badge">
        <strong>💰 ${L("entryConfirmed")} 💰</strong>
      </div>
      
      <div class="sender-info">
        <div class="sender-field">${L("receivedFrom")}: <strong>${escapeHtml(receiptData.receivedFrom.name.toUpperCase())}</strong></div>
        <div class="sender-field">${L("phone")}: <strong>${escapeHtml(receiptData.receivedFrom.phone)}</strong></div>
        ${
          receiptData.receivedFrom.email
            ? `<div class="sender-field">${L("email")}: <strong>${escapeHtml(receiptData.receivedFrom.email)}</strong></div>`
            : ""
        }
      </div>
      
      ${receiptData.description ? `
        <div class="description">
          <strong>${L("description")}:</strong> <strong>${escapeHtml(receiptData.description)}</strong>
        </div>
      ` : ''}
      
      <div class="receipt-title">${L("entryDetails")}</div>
      
      <div class="details-section">
        <div class="detail-row">
          <div class="detail-label"><strong>${L("source")}:</strong></div>
          <div class="detail-value"><strong>${escapeHtml(entrySourceLabel(t, receiptData.source))}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>${L("category")}:</strong></div>
          <div class="detail-value"><strong>${escapeHtml(entryCategoryLabel(t, receiptData.category))}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>${L("paymentMethod")}:</strong></div>
          <div class="detail-value"><strong>${escapeHtml(uiPaymentLabel(t, receiptData.paymentMethod).toUpperCase())}</strong></div>
        </div>
      </div>
      
      <div class="amount-section">
        <div class="amount-row">
          <div><strong>${L("amountReceived")}:</strong></div>
          <div><strong>${enteredAmountText(receiptData)}</strong></div>
        </div>
        ${
          receiptData.enteredCurrency === "FC"
            ? `<div class="amount-row">
                 <div><strong>${L("usdEquivalent")}:</strong></div>
                 <div><strong>$${receiptData.amountUSD.toFixed(2)}</strong></div>
               </div>`
            : ''
        }
      </div>
      
      <div class="agent-info">
        ${L("recordedBy")}: <strong>${escapeHtml(receiptData.agent.toUpperCase())}</strong>
      </div>
      
      ${festiveGreetingHtml()}
      <div class="footer">
        <div class="thank-you"><strong>${L("entrySaved")}</strong></div>
        <div class="warning"><strong>${L("keepAsProof")}</strong></div>
        <div class="warning"><strong>${L("thanksTrust")}</strong></div>
        <div class="thank-you"><strong>${L("seeYou")}</strong></div>
      </div>

      <!-- PAPER CUT INDICATOR -->
      <div class="cut-line">
        ✄ ────────────────────────── ✄
      </div>
    </div>
  </body>
</html>
`);
      printWindow.document.close();
      printAndClose(printWindow);
    }
  };

  // Print function for entry stub only
  const printStubOnly = () => {
    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (printWindow && receiptData) {
      printWindow.document.write(`
<html>
  <head>
    <title>${L("entryStubTitle")}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body { 
        font-family: 'Courier New', Courier, monospace; 
        margin: 0; 
        padding: 0; 
        font-size: 13px;
        font-weight: bold;
        line-height: 1.1;
        width: 72mm;
        background-color: white;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        display: flex;
        justify-content: center;
      }
      .stub-container { 
        width: 70mm;
        margin: 0 auto;
        padding: 0.5mm;
        border: none;
        text-align: center;
      }
      .header { 
        text-align: center; 
        margin-bottom: 1mm; 
        padding-bottom: 1mm;
        border-bottom: 2px double #000;
      }
      .shop-name {
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 0.5mm;
        text-transform: uppercase;
      }
      .shop-details {
        font-size: 11px;
        margin-bottom: 0.3mm;
        line-height: 1;
        font-weight: bold;
      }
      .receipt-info {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #f8f8f8;
        border-left: 3px solid #000;
      }
      .receipt-title {
        font-size: 13px;
        font-weight: bold;
        margin: 1mm 0;
        text-transform: uppercase;
        background-color: #000;
        color: white;
        padding: 1mm;
        border-radius: 2px;
      }
      .stub-number {
        font-size: 13px;
        font-weight: bold;
        margin: 1mm 0;
        text-transform: uppercase;
        background-color: #333;
        color: white;
        padding: 1mm 2mm;
        border-radius: 3px;
      }
      .details-section {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #fafafa;
        border: 1px solid #eee;
      }
      .detail-row { 
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5mm;
        padding: 0 1mm;
        border-bottom: 1px dotted #ddd;
      }
      .detail-label {
        text-align: left;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .detail-value {
        text-align: right;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .amount-section { 
        font-weight: bold; 
        margin-top: 1mm;
        padding: 1mm;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .amount-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.3mm;
        font-size: 13px;
        padding: 0 1mm;
      }
      .payment-method {
        text-transform: uppercase;
        font-weight: bold;
        font-size: 13px;
      }
      .stub-footer { 
        text-align: center; 
        margin-top: 1mm; 
        font-size: 11px;
        font-weight: bold;
        padding: 1mm;
        background-color: #e8e8e8;
        border: 1px solid #ccc;
        border-radius: 3px;
      }
      .agent-info {
        margin-top: 1mm;
        text-align: center;
        font-weight: bold;
        font-size: 12px;
        padding: 1mm;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 2px;
      }
      .sender-info {
        margin: 1mm 0;
        padding: 1mm;
        font-weight: bold;
        text-align: center;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .sender-field {
        margin-bottom: 0.3mm;
        font-size: 12px;
      }
      .separator {
        border-top: 1px dashed #000;
        margin: 1mm 0;
      }
      .cut-line {
        text-align: center;
        margin: 1mm 0;
        font-weight: bold;
        font-size: 11px;
        color: #000;
        letter-spacing: 1px;
      }
      .thank-you {
        font-weight: bold;
        margin: 0.5mm 0;
        font-size: 12px;
      }
      .warning {
        font-size: 10px;
        color: #000;
        margin: 0.3mm 0;
        font-weight: bold;
      }
      .description {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #f5f5f5;
        border-left: 3px solid #ccc;
        font-size: 11px;
        font-weight: bold;
        border-radius: 2px;
      }
      .section-divider {
        height: 2px;
        background: linear-gradient(to right, transparent, #000, transparent);
        margin: 1mm 0;
      }
      @media print {
        @page {
          margin: 0 !important;
          size: 72mm auto !important;
        }
        body { 
          margin: 0 !important; 
          padding: 0 !important; 
          width: 72mm !important;
          font-size: 13px !important;
          background: white !important;
          font-weight: bold !important;
          height: auto !important;
          overflow: hidden !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          display: flex !important;
          justify-content: center !important;
        }
        .stub-container { 
          border: none !important; 
          box-shadow: none !important; 
          margin: 0 auto !important;
          padding: 0.5mm !important;
          width: 70mm !important;
          page-break-after: avoid !important;
          page-break-inside: avoid !important;
        }
        .cut-line {
          page-break-after: always !important;
          margin-bottom: 0 !important;
        }
        body::after,
        body::before {
          display: none !important;
          content: none !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="stub-container">
      <div class="header">
        <div class="shop-name"><strong>${escapeHtml(receiptData.shopName)}</strong></div>
        <div class="shop-details"><strong>${escapeHtml(receiptData.shopAddress)}</strong></div>
        <div class="shop-details">${L("tel")}: <strong>${escapeHtml(receiptData.shopNumber)}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">${L("date")}: <strong>${escapeHtml(receiptData.date)}</strong></div>
        <div class="shop-details">${L("receiptNo")}: <strong>${escapeHtml(receiptData.receiptNumber)}</strong></div>
      </div>
      
      <div class="stub-number">
        <strong>${L("entryStubNo")}${escapeHtml(receiptData.stubNumber)}</strong>
      </div>
      
      <div class="sender-info">
        <div class="sender-field">${L("receivedFrom")}: <strong>${escapeHtml(receiptData.receivedFrom.name.toUpperCase())}</strong></div>
        <div class="sender-field">${L("phone")}: <strong>${escapeHtml(receiptData.receivedFrom.phone)}</strong></div>
      </div>
      
      ${receiptData.description ? `
        <div class="description">
          <strong>${L("description")}:</strong> <strong>${escapeHtml(receiptData.description)}</strong>
        </div>
      ` : ''}
      
      <div class="receipt-title">${L("entryDetails")}</div>
      
      <div class="details-section">
        <div class="detail-row">
          <div class="detail-label"><strong>${L("source")}:</strong></div>
          <div class="detail-value"><strong>${escapeHtml(entrySourceLabel(t, receiptData.source))}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>${L("category")}:</strong></div>
          <div class="detail-value"><strong>${escapeHtml(entryCategoryLabel(t, receiptData.category))}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>${L("paymentMethod")}:</strong></div>
          <div class="detail-value"><strong>${escapeHtml(uiPaymentLabel(t, receiptData.paymentMethod).toUpperCase())}</strong></div>
        </div>
      </div>
      
      <div class="amount-section">
        <div class="amount-row">
          <div><strong>${L("amountReceived")}:</strong></div>
          <div><strong>${enteredAmountText(receiptData)}</strong></div>
        </div>
      </div>
      
      <div class="agent-info">
        ${L("recordedBy")}: <strong>${escapeHtml(receiptData.agent.toUpperCase())}</strong>
      </div>
      
      <div class="stub-footer">
        <div class="thank-you"><strong>${L("entryStub")}</strong></div>
        <div class="warning"><strong>${escapeHtml(receiptData.shopName)}</strong></div>
        <div class="warning"><strong>${L("keepStub")}</strong></div>
        <div class="warning">${L("receiptNo")}: <strong>${escapeHtml(receiptData.receiptNumber)}</strong></div>
        <div class="warning">${L("date")}: <strong>${escapeHtml(receiptData.date)}</strong></div>
        <div class="warning">${L("source")}: <strong>${escapeHtml(entrySourceLabel(t, receiptData.source))}</strong></div>
        <div class="warning">${L("amount")}: <strong>${enteredAmountText(receiptData)}</strong></div>
      </div>
      
      <!-- PAPER CUT INDICATOR -->
      <div class="cut-line">
        ✄ ────────────────────────── ✄
      </div>
    </div>
  </body>
</html>
`);
      printWindow.document.close();
      printAndClose(printWindow);
    }
  };

  // Sequential printing function for entries
  const printSequentially = () => {
    // Print receipt first
    printReceiptOnly();
    
    // Wait 2 seconds then print stub
    setTimeout(() => {
      printStubOnly();
    }, 2000);
  };
  // Latest printSequentially for the effect below (its trigger list stays unchanged).
  const printSequentiallyRef = useRef(printSequentially);
  printSequentiallyRef.current = printSequentially;

  useEffect(() => {
    if (receiptData) {
      // Small delay to ensure the receipt data is set
      const timer = setTimeout(() => {
        printSequentiallyRef.current();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [receiptData]);

  async function handleEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid || submittingRef.current) return;

    submittingRef.current = true;
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      // Convert payment method to match backend model
      const normalizedPaymentMethod = uiToModelPayment(form.paymentMethod);
      const amountSnapshot = createAmountSnapshot(
        parseFloat(form.currencyMode === "fc" ? form.amountInFC : form.amount),
        form.currencyMode === "fc" ? "FC" : "USD",
        exchangeRate?.rate
      );

      const body = {
        amount: amountSnapshot.amountUSD,
        ...amountSnapshot,
        source: form.source,
        category: form.category,
        paymentMethod: normalizedPaymentMethod,
        description: form.description,
        receivedFrom: {
          name: form.receivedFromName,
          phone: form.receivedFromPhone,
          email: form.receivedFromEmail || "",
        }
      };

      const res = await apiRequest("entries", {
        method: "POST",
        body: JSON.stringify(body),
      });

      // Use safe JSON parser to handle HTML errors
      const data = await readJsonSafe(res);
      
      if (!res.ok) {
        throw new Error(serverMessage(data?.error || data?.message || data?.text, t("entry.failedStatus", { status: res.status })));
      }

      // Get the entry ID from the API response
      const entryId = data.entryId || data._id;
      
      // Enhanced receipt data
      const newReceiptData = {
        shopName: "ETS. DIEU MERCI",
        shopAddress: "Av Manono Coin Munama N°39, C. Kenya, Lubumbashi",
        shopNumber: "+243 977 771 421 / +243 853 549 102",
        shopRegistration: "RCCM: 14-A-017885",
        amount: amountSnapshot.amountUSD,
        ...amountSnapshot,
        source: form.source,
        category: form.category,
        paymentMethod: form.paymentMethod, // Keep UI payment method for display
        description: form.description,
        receivedFrom: {
          name: form.receivedFromName,
          phone: form.receivedFromPhone,
          email: form.receivedFromEmail,
        },
        agent: currentUser?.username || "Agent",
        date: formatNowGMT2(),
        receiptNumber: entryId,
        stubNumber: entryId,
        exchangeRate: exchangeRate?.rate
      };

      setReceiptData(newReceiptData);

      // Reset form
      setForm({
        amount: "",
        amountInFC: "",
        source: "",
        category: "",
        paymentMethod: "cash",
        description: "",
        receivedFromName: "",
        receivedFromPhone: "",
        receivedFromEmail: "",
        currencyMode: "usd"
      });

      setMessage(t("entry.success", { id: entryId }));
    } catch (e) {
      console.error("Error creating entry:", e);
      setError(e instanceof Error && e.message ? e.message : t("entry.failed"));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="page page-narrow cash-form-page">
      <PageHeader
        eyebrow={t("nav.sections.cash")}
        icon={<CircleArrowDown aria-hidden="true" />}
        title={t("entry.title")}
        description={t("entry.subtitle")}
        actions={<ExchangeRateChip loading={loadingRate} rate={exchangeRate} />}
      />

      {message && (
        <div className="alert alert-success" role="status">
          <CheckCircle2 aria-hidden="true" /><span>{message} <a href="/entryhistory" className="underline">{t("entry.seeHistory")}</a></span>
          {receiptData && (
            // Auto-print runs outside a click, so the browser may block the popups; these reprint on demand.
            <span className="flex gap-2 ml-auto">
              <button type="button" onClick={printReceiptOnly} className="underline">{t("entry.reprintReceipt")}</button>
              <button type="button" onClick={printStubOnly} className="underline">{t("entry.reprintStub")}</button>
            </span>
          )}
        </div>
      )}
      {error && <div className="alert alert-danger" role="alert"><AlertTriangle aria-hidden="true" /><span>{error}</span></div>}

      <form onSubmit={handleEntry} className="card cash-form">
        <div className="card-body cash-form-body">
          <fieldset className="form-section">
            <legend><DollarSign aria-hidden="true" className="inline-icon" />{t("entry.sectionMoney")}</legend>
            <div className="form-row">
              <div className="field">
                <div className="field-label-row">
                  <span className="field-label">{t("sortie.amount")} ({form.currencyMode === "usd" ? "USD" : "FC"}) *</span>
                  <button type="button" onClick={toggleCurrencyMode} className="btn btn-ghost btn-sm">
                    <Calculator aria-hidden="true" />{form.currencyMode === "usd" ? "USD → FC" : "FC → USD"}
                  </button>
                </div>
                {form.currencyMode === "usd" ? (
                  <input aria-label={`${t("sortie.amount")} *`} className="input num" type="number" step="0.01" name="amount" value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder={t("entry.amountUsdPlaceholder")} min="0.01" required />
                ) : (
                  <input aria-label={`${t("sortie.amount")} *`} className="input num" type="number" name="amountInFC" value={form.amountInFC}
                    onChange={(e) => setForm({ ...form, amountInFC: e.target.value })} placeholder={t("entry.amountFcPlaceholder")} min="1" required />
                )}
                {form.amount && form.currencyMode === "usd" && exchangeRate && <span className="field-hint num">≈ {formatFc(parseFloat(form.amount) * exchangeRate.rate)}</span>}
                {form.amountInFC && form.currencyMode === "fc" && exchangeRate && <span className="field-hint num">≈ {formatCurrency(parseFloat(form.amountInFC) / exchangeRate.rate)}</span>}
              </div>
              <label className="field">
                <span className="field-label">{t("sortie.paymentMethod")} *</span>
                <select className="input" name="paymentMethod" value={form.paymentMethod} onChange={handleChange} required>
                  {(["cash", "mpesa", "bank", "card", "other"] as const).map((value) => <option key={value} value={value}>{uiPaymentLabel(t, value)}</option>)}
                </select>
              </label>
              <label className="field">
                <span className="field-label">{t("entry.source")} *</span>
                <select className="input" name="source" value={form.source} onChange={handleChange} required>
                  <option value="">{t("entry.selectSource")}</option>
                  {sources.map((source) => <option key={source} value={source}>{entrySourceLabel(t, source)}</option>)}
                </select>
              </label>
              <label className="field">
                <span className="field-label">{t("entry.category")} *</span>
                <select className="input" name="category" value={form.category} onChange={handleChange} required>
                  <option value="">{t("entry.selectCategory")}</option>
                  {categories.map((category) => <option key={category} value={category}>{entryCategoryLabel(t, category)}</option>)}
                </select>
              </label>
            </div>
            <label className="field">
              <span className="field-label">{t("entry.description")} {t("common.optional")}</span>
              <textarea className="input" name="description" value={form.description} onChange={handleChange} placeholder={t("entry.descriptionPlaceholder")} rows={2} />
            </label>
          </fieldset>

          <fieldset className="form-section">
            <legend><User aria-hidden="true" className="inline-icon" />{t("entry.sectionSender")}</legend>
            <div className="form-row">
              <label className="field">
                <span className="field-label">{t("entry.senderName")} *</span>
                <input className="input" type="text" name="receivedFromName" value={form.receivedFromName} onChange={handleChange} placeholder={t("entry.senderNamePlaceholder")} required />
              </label>
              <label className="field">
                <span className="field-label">{t("entry.senderPhone")} *</span>
                <input className="input" type="tel" name="receivedFromPhone" value={form.receivedFromPhone} onChange={handleChange} placeholder={t("entry.senderPhonePlaceholder")} required />
              </label>
            </div>
            <label className="field">
              <span className="field-label">{t("entry.senderEmail")} {t("common.optional")}</span>
              <input className="input" type="email" name="receivedFromEmail" value={form.receivedFromEmail} onChange={handleChange} placeholder={t("entry.senderEmailPlaceholder")} />
            </label>
          </fieldset>
          {!isFormValid && <p className="field-hint">{t("entry.requiredHint")}</p>}
        </div>
        <footer className="dialog-foot">
          <button type="submit" disabled={!isFormValid || submitting} className="btn btn-primary btn-lg">
            {submitting ? <RefreshCw className="animate-spin" aria-hidden="true" /> : <FileText aria-hidden="true" />}
            {submitting ? t("common.saving") : t("entry.submit")}
          </button>
        </footer>
      </form>

      {/* Hidden receipt container */}
      <div ref={receiptRef} style={{ display: "none" }} />
    </div>
  );
}
