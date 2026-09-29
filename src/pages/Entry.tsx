/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from "react";
import PageHeader from "../components/ui/PageHeader";
import ExchangeRateChip from "../components/ui/ExchangeRateChip";
import { formatNowGMT2 } from "../utils/dateUtils";
import { useAuth } from "../hooks/useAuth";
import { AlertTriangle, CheckCircle2, DollarSign, RefreshCw, FileText, User, Calculator } from "lucide-react";
import { serverUrl } from "../utils/constants";
import { createAmountSnapshot } from "../utils/salePricing";
import { apiRequest } from "../lib/api";

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
  const [submitting, setSubmitting] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
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

  // Format function for FC display
  const formatFc = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' FC';
  };

  // Format function for USD display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Print function for entry receipt only
  const printReceiptOnly = () => {
    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (printWindow && receiptData) {
      printWindow.document.write(`
<html>
  <head>
    <title>Reçu d'Entrée d'Argent</title>
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
    </style>
  </head>
  <body>
    <div class="receipt-container">
      <div class="header">
        <div class="shop-name"><strong>${escapeHtml(receiptData.shopName)}</strong></div>
        <div class="shop-details"><strong>${escapeHtml(receiptData.shopAddress)}</strong></div>
        <div class="shop-details">TEL: <strong>${escapeHtml(receiptData.shopNumber)}</strong></div>
        <div class="shop-details"><strong>${escapeHtml(receiptData.shopRegistration)}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">DATE: <strong>${escapeHtml(receiptData.date)}</strong></div>
        <div class="shop-details">REÇU #: <strong>${escapeHtml(receiptData.receiptNumber)}</strong></div>
      </div>
      
      <div class="entry-badge">
        <strong>💰 ENTRÉE D'ARGENT CONFIRMÉE 💰</strong>
      </div>
      
      <div class="sender-info">
        <div class="sender-field">REÇU DE: <strong>${escapeHtml(receiptData.receivedFrom.name.toUpperCase())}</strong></div>
        <div class="sender-field">TÉLÉPHONE: <strong>${escapeHtml(receiptData.receivedFrom.phone)}</strong></div>
        ${
          receiptData.receivedFrom.email
            ? `<div class="sender-field">EMAIL: <strong>${escapeHtml(receiptData.receivedFrom.email)}</strong></div>`
            : ""
        }
      </div>
      
      ${receiptData.description ? `
        <div class="description">
          <strong>DESCRIPTION:</strong> <strong>${escapeHtml(receiptData.description)}</strong>
        </div>
      ` : ''}
      
      <div class="receipt-title">DÉTAILS DE L'ENTRÉE</div>
      
      <div class="details-section">
        <div class="detail-row">
          <div class="detail-label"><strong>SOURCE:</strong></div>
          <div class="detail-value"><strong>${escapeHtml(receiptData.source)}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>CATÉGORIE:</strong></div>
          <div class="detail-value"><strong>${escapeHtml(receiptData.category)}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>MÉTHODE PAIEMENT:</strong></div>
          <div class="detail-value"><strong>${escapeHtml(receiptData.paymentMethod.toUpperCase())}</strong></div>
        </div>
      </div>
      
      <div class="amount-section">
        <div class="amount-row">
          <div><strong>MONTANT REÇU:</strong></div>
          <div><strong>${receiptData.enteredCurrency === "FC" ? `${receiptData.enteredAmount.toLocaleString("fr-FR")} FC` : `$${receiptData.enteredAmount.toFixed(2)}`}</strong></div>
        </div>
        ${
          receiptData.enteredCurrency === "FC"
            ? `<div class="amount-row">
                 <div><strong>ÉQUIVALENT USD:</strong></div>
                 <div><strong>$${receiptData.amountUSD.toFixed(2)}</strong></div>
               </div>`
            : ''
        }
      </div>
      
      <div class="agent-info">
        Enregistré par: <strong>${escapeHtml(receiptData.agent.toUpperCase())}</strong>
      </div>
      
      <div class="footer">
        <div class="thank-you"><strong>ENTRÉE ENREGISTRÉE AVEC SUCCÈS !</strong></div>
        <div class="warning"><strong>Conserver ce reçu comme preuve</strong></div>
        <div class="warning"><strong>Merci pour votre confiance</strong></div>
        <div class="thank-you"><strong>À BIENTÔT !</strong></div>
      </div>

      <!-- PAPER CUT INDICATOR -->
      <div class="cut-line">
        ✄ ────────────────────────── ✄
      </div>
    </div>
    <script>
      window.onload = function() {
        try {
          window.print();
        } catch(e) {
          console.error('Print error:', e);
        }
        setTimeout(() => {
          window.close();
        }, 1000);
      };
    </script>
  </body>
</html>
`);
      printWindow.document.close();
    }
  };

  // Print function for entry stub only
  const printStubOnly = () => {
    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (printWindow && receiptData) {
      printWindow.document.write(`
<html>
  <head>
    <title>Souche Entrée d'Argent</title>
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
        <div class="shop-details">TEL: <strong>${escapeHtml(receiptData.shopNumber)}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">DATE: <strong>${escapeHtml(receiptData.date)}</strong></div>
        <div class="shop-details">REÇU #: <strong>${escapeHtml(receiptData.receiptNumber)}</strong></div>
      </div>
      
      <div class="stub-number">
        <strong>SOUCHE ENTRÉE N°${escapeHtml(receiptData.stubNumber)}</strong>
      </div>
      
      <div class="sender-info">
        <div class="sender-field">REÇU DE: <strong>${escapeHtml(receiptData.receivedFrom.name.toUpperCase())}</strong></div>
        <div class="sender-field">TÉLÉPHONE: <strong>${escapeHtml(receiptData.receivedFrom.phone)}</strong></div>
      </div>
      
      ${receiptData.description ? `
        <div class="description">
          <strong>DESCRIPTION:</strong> <strong>${escapeHtml(receiptData.description)}</strong>
        </div>
      ` : ''}
      
      <div class="receipt-title">DÉTAILS ENTRÉE</div>
      
      <div class="details-section">
        <div class="detail-row">
          <div class="detail-label"><strong>SOURCE:</strong></div>
          <div class="detail-value"><strong>${escapeHtml(receiptData.source)}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>CATÉGORIE:</strong></div>
          <div class="detail-value"><strong>${escapeHtml(receiptData.category)}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>MÉTHODE PAIEMENT:</strong></div>
          <div class="detail-value"><strong>${escapeHtml(receiptData.paymentMethod.toUpperCase())}</strong></div>
        </div>
      </div>
      
      <div class="amount-section">
        <div class="amount-row">
          <div><strong>MONTANT REÇU:</strong></div>
          <div><strong>${receiptData.enteredCurrency === "FC" ? `${receiptData.enteredAmount.toLocaleString("fr-FR")} FC` : `$${receiptData.enteredAmount.toFixed(2)}`}</strong></div>
        </div>
      </div>
      
      <div class="agent-info">
        Enregistré par: <strong>${escapeHtml(receiptData.agent.toUpperCase())}</strong>
      </div>
      
      <div class="stub-footer">
        <div class="thank-you"><strong>SOUCHE ENTRÉE D'ARGENT</strong></div>
        <div class="warning"><strong>${escapeHtml(receiptData.shopName)}</strong></div>
        <div class="warning"><strong>Conserver cette souche</strong></div>
        <div class="warning">Reçu #: <strong>${escapeHtml(receiptData.receiptNumber)}</strong></div>
        <div class="warning">Date: <strong>${escapeHtml(receiptData.date)}</strong></div>
        <div class="warning">Source: <strong>${escapeHtml(receiptData.source)}</strong></div>
        <div class="warning">Montant: <strong>${receiptData.enteredCurrency === "FC" ? `${receiptData.enteredAmount.toLocaleString("fr-FR")} FC` : `$${receiptData.enteredAmount.toFixed(2)}`}</strong></div>
      </div>
      
      <!-- PAPER CUT INDICATOR -->
      <div class="cut-line">
        ✄ ────────────────────────── ✄
      </div>
    </div>
    <script>
      window.onload = function() {
        try {
          window.print();
        } catch(e) {
          console.error('Print error:', e);
        }
        setTimeout(() => {
          window.close();
        }, 1000);
      };
    </script>
  </body>
</html>
`);
      printWindow.document.close();
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

  useEffect(() => {
    if (receiptData) {
      // Small delay to ensure the receipt data is set
      const timer = setTimeout(() => {
        printSequentially();
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
        const msg = data?.error || data?.message || data?.text || `Échec de l'enregistrement (${res.status})`;
        throw new Error(msg);
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

      setMessage(
        `Entrée ${entryId} enregistrée avec succès. Impression du reçu et de la souche…`
      );
    } catch (e: any) {
      console.error("Error creating entry:", e);
      setError(e?.message || "L'entrée d'argent n'a pas pu être enregistrée");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="page page-narrow">
      <div>
        <PageHeader
          title="Entrée de caisse"
          description="Enregistrer une entrée d'argent, son expéditeur et son mode de paiement."
          actions={<ExchangeRateChip loading={loadingRate} rate={exchangeRate} />}
        />

        {message && (
          <div className="alert alert-success mb-4" role="status">
            <CheckCircle2 aria-hidden="true" /><span>{message} <a href="/entryhistory" className="underline">Voir l'historique des entrées</a></span>
            {receiptData && (
              // Auto-print runs outside a click, so the browser may block the popups; these reprint on demand.
              <span className="flex gap-2 ml-auto">
                <button type="button" onClick={printReceiptOnly} className="underline">Réimprimer le reçu</button>
                <button type="button" onClick={printStubOnly} className="underline">Réimprimer la souche</button>
              </span>
            )}
          </div>
        )}
        {error && (
          <div className="alert alert-danger mb-4" role="alert"><AlertTriangle aria-hidden="true" /><span>{error}</span></div>
        )}

        <form onSubmit={handleEntry} className="space-y-6">
          {/* Amount and Basic Info */}
          <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Informations de l'Entrée
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-medium text-gray-700">
                    Montant *
                  </label>
                  <button
                    type="button"
                    onClick={toggleCurrencyMode}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    <Calculator className="w-3 h-3" />
                    {form.currencyMode === 'usd' ? 'USD → FC' : 'FC → USD'}
                  </button>
                </div>
                
                {form.currencyMode === 'usd' ? (
                  <input aria-label="Montant *"
                    type="number"
                    step="0.01"
                    name="amount"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="Entrer le montant en USD"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0.01"
                    required
                  />
                ) : (
                  <input aria-label="Montant *"
                    type="number"
                    name="amountInFC"
                    value={form.amountInFC}
                    onChange={(e) => setForm({ ...form, amountInFC: e.target.value })}
                    placeholder="Entrer le montant en FC"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    required
                  />
                )}
                
                {/* Conversion Display */}
                {form.amount && form.currencyMode === 'usd' && exchangeRate && (
                  <p className="text-xs text-green-600 mt-1">
                    ≈ {formatFc(parseFloat(form.amount) * exchangeRate.rate)}
                  </p>
                )}
                {form.amountInFC && form.currencyMode === 'fc' && exchangeRate && (
                  <p className="text-xs text-green-600 mt-1">
                    ≈ {formatCurrency(parseFloat(form.amountInFC) / exchangeRate.rate)}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="entry-field-34674" className="block mb-2 font-medium text-gray-700">
                  Source *
                </label>
                <select id="entry-field-34674"
                  name="source"
                  value={form.source}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner la source</option>
                  {sources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="entry-field-35456" className="block mb-2 font-medium text-gray-700">
                  Catégorie *
                </label>
                <select id="entry-field-35456"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner la catégorie</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="entry-field-36266" className="block mb-2 font-medium text-gray-700">
                  Méthode de Paiement *
                </label>
                <select id="entry-field-36266"
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="cash">Espèces</option>
                  <option value="mpesa">M-Pesa ou Airtel Money (Transfert)</option>
                  <option value="bank">Transfert Bancaire</option>
                  <option value="card">Carte Visa</option>
                  <option value="other">Autre</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="entry-field-37169" className="block mb-2 font-medium text-gray-700">
                Description (Optionnel)
              </label>
              <textarea id="entry-field-37169"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Description de l'entrée d'argent..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
          </div>

          {/* Received From Information */}
          <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Informations de l'Expéditeur
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="entry-field-38178" className="block mb-2 font-medium text-gray-700">
                  Nom de l'Expéditeur *
                </label>
                <input id="entry-field-38178"
                  type="text"
                  name="receivedFromName"
                  value={form.receivedFromName}
                  onChange={handleChange}
                  placeholder="Entrer le nom de la personne"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="entry-field-38804" className="block mb-2 font-medium text-gray-700">
                  Téléphone de l'Expéditeur *
                </label>
                <input id="entry-field-38804"
                  type="tel"
                  name="receivedFromPhone"
                  value={form.receivedFromPhone}
                  onChange={handleChange}
                  placeholder="Entrer le numéro de téléphone"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="entry-field-39464" className="block mb-2 font-medium text-gray-700">
                  Email de l'Expéditeur (Optionnel)
                </label>
                <input id="entry-field-39464"
                  type="email"
                  name="receivedFromEmail"
                  value={form.receivedFromEmail}
                  onChange={handleChange}
                  placeholder="Entrer l'email de l'expéditeur"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
            <button
              type="submit"
              disabled={!isFormValid || submitting}
              className={`w-full px-8 py-4 rounded-lg font-medium text-lg flex items-center justify-center gap-2 ${
                isFormValid && !submitting
                  ? "bg-green-600 hover:bg-green-700 text-white shadow-sm"
                  : "bg-gray-400 cursor-not-allowed text-white"
              } transition-colors`}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Enregistrement en cours...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Enregistrer l'Entrée d'Argent
                </span>
              )}
            </button>

            {!isFormValid && (
              <p className="text-sm text-orange-600 mt-2 text-center">
                * Veuillez remplir tous les champs obligatoires (Montant, Source, Catégorie, Nom et Téléphone)
              </p>
            )}
          </div>
        </form>

        {/* Hidden receipt container */}
        <div ref={receiptRef} style={{ display: "none" }} />
      </div>
    </div>
  );
}
