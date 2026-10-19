"use client";
import ResponsiveTable from "../components/ui/ResponsiveTable";
import Dialog from "../components/ui/Dialog";
import { EmptyState, LoadingState } from "../components/ui/States";

import { useState, useEffect, useRef } from "react";
import { formatDateTimeGMT2 } from "../utils/dateUtils";
import { serverUrl } from "../utils/constants";
import PeriodPicker from "../components/inventory/PeriodPicker";
import { initialPeriodSelection, usePeriodRange } from "../hooks/usePeriodRange";
import { describePeriod, periodQuery } from "../utils/dashboardPeriod";
import {
  Search,
  FileText,
  Eye,
  Download,
  User,
  DollarSign,
  Edit,
  Trash2,
  RefreshCw,
  Printer,
  Calendar,
  History,
  Filter,
  Shield, X, CheckCircle, AlertTriangle } from "lucide-react";
import jsPDF from "jspdf";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/ui/PageHeader";
import { formatNumber, formatUSD } from "../i18n/format";
import { activeLocale } from "../i18n/translate";
import { serverMessage } from "../i18n/serverMessages";
import { entryCategoryLabel, entrySourceLabel, uiPaymentLabel } from "../utils/entryLabels";
import { pdfSafe } from "../utils/pdfText";
import type { CountAmount, FieldChange, FieldChanges } from "../types/records";

interface EditHistoryEntry {
  editedBy: string;
  editedAt: string;
  changes: FieldChanges;
  reason: string;
  _id?: string;
}

interface Entry {
  _id: string;
  entryId: string;
  amount: number;
  enteredAmount?: number;
  enteredCurrency?: "USD" | "FC";
  amountUSD?: number;
  amountFC?: number;
  exchangeRate?: number;
  source: string;
  category: string;
  paymentMethod: string;
  description: string;
  receivedFrom: {
    name: string;
    phone: string;
    email: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    _id: string;
    username: string;
  };
  updatedBy?: string;
  editedBy?: string;
  editedAt?: string;
  editHistory?: EditHistoryEntry[];
}

// User interface for role checking
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  username?: string;
  permissions?: string[];
}

interface PaginationMetadata {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface EntrySummaryGroup {
  count: number;
  amount: number;
}

interface EntrySummary {
  totalRecords: number;
  totalAmount: number;
  active: EntrySummaryGroup;
  deleted: EntrySummaryGroup;
  paymentMethods: Record<string, EntrySummaryGroup>;
  categories: Record<string, EntrySummaryGroup>;
  sources: Record<string, EntrySummaryGroup>;
}



export default function EntryHistory() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopSettings, setShopSettings] = useState({
    shopName: "ETS. DIEU MERCI",
    shopAddress: "Av Manono Coin Munama N°39, C. Kenya, Lubumbashi",
    shopNumber: "+243 977 771 421 / +243 853 549 102",
    shopRegistration: "RCCM: 14-A-017885",
    // null = settings not loaded yet: the printed footer then uses the translated default.
    receiptFooter: null as string | null,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [editForm, setEditForm] = useState({
    amount: 0,
    source: "",
    category: "",
    paymentMethod: "cash" as "cash" | "card" | "transfer" | "other",
    description: "",
    receivedFrom: { name: "", phone: "", email: "" },
    reason: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // User state for role checking
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Timeframe state
  // Same period calendar as the Fiche de stock.
  const [periodSelection, setPeriodSelection] = useState(() => initialPeriodSelection("today"));
  const periodRange = usePeriodRange(periodSelection);
  const periodKey = periodRange ? periodQuery(periodRange) : null;

  // Edited entries filter state
  const [showEditedEntries, setShowEditedEntries] = useState(false);
  const [editedEntries, setEditedEntries] = useState<Entry[]>([]);
  const [selectedEditedEntry, setSelectedEditedEntry] = useState<Entry | null>(null);
  const [showEditedDetailsModal, setShowEditedDetailsModal] = useState(false);
  const [summary, setSummary] = useState<EntrySummary | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);

  // Sources and categories (same as Entry.tsx)
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

  const categories = [
    "Revenue Ventes",
    "Dépôt Espèces",
    "Remboursement",
    "Prêt",
    "Investissement",
    "Revenue Divers",
    "Autre Catégorie"
  ];


  // Fetch current user on component mount
  // Latest fetchEntries for the effect below (its trigger list stays unchanged).
  const fetchEntriesRef = useRef<typeof fetchEntries>(undefined as unknown as typeof fetchEntries);
  useEffect(() => {
    fetchCurrentUser();
    fetchEntriesRef.current();
    fetch(`${serverUrl}/settings/receipt`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setShopSettings({
            shopName: data.shopName || "ETS. DIEU MERCI",
            shopAddress: data.shopAddress || "",
            shopNumber: data.shopNumber || "",
            shopRegistration: data.shopRegistration || "",
            receiptFooter: data.receiptFooter || "",
          });
        }
      })
      .catch(() => {});
  }, []);

  // Fetch entries when timeframe or filters change
  useEffect(() => {
    if (currentUser !== null) { // Only fetch entries after user data is loaded
      fetchEntriesRef.current();
    }
  }, [periodKey, showEditedEntries, currentUser, currentPage, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [periodKey, showEditedEntries, searchTerm]);

  // Update edited entries when entries change
  // Latest updateEditedEntries for the effect below (its trigger list stays unchanged).
  const updateEditedEntriesRef = useRef<typeof updateEditedEntries>(undefined as unknown as typeof updateEditedEntries);
  useEffect(() => {
    updateEditedEntriesRef.current();
  }, [entries]);

  // Fetch current user from API or localStorage
  const fetchCurrentUser = async () => {
    try {
      // Try to get user from localStorage first
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setCurrentUser(userData);
        setIsAdmin(userData.role === "admin" || userData.role === "administrator");
      } else {
        // Fallback to API call
        const res = await fetch(`${serverUrl}/auth/me`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });

        if (res.ok) {
          const userData = await res.json();
          setCurrentUser(userData);
          setIsAdmin(userData.role === "admin" || userData.role === "administrator");
          localStorage.setItem("user", JSON.stringify(userData));
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Default to non-admin if can't fetch user
      setIsAdmin(false);
    }
  };

  const updateEditedEntries = () => {
    // Filter entries that have editHistory or editedBy field
    const edited = entries.filter(entry => 
      (entry.editHistory && entry.editHistory.length > 0) || entry.editedBy
    );

    // Sort by edit date (newest first)
    const sortedEditedEntries = edited.sort((a, b) => {
      const dateA = a.editedAt ? new Date(a.editedAt).getTime() : new Date(a.updatedAt).getTime();
      const dateB = b.editedAt ? new Date(b.editedAt).getTime() : new Date(b.updatedAt).getTime();
      return dateB - dateA;
    });

    setEditedEntries(sortedEditedEntries);
  };
  updateEditedEntriesRef.current = updateEditedEntries;

  const fetchEntries = async () => {
    if (!periodKey) return;
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters based on timeframe
      const timeframeParams = periodKey;
      
      // Add status filter for edited entries view
      const statusParam = showEditedEntries ? "&status=all" : "&status=active";
      const pageParam = `&page=${currentPage}&limit=50`;
      const searchParam = searchTerm.trim() ? `&search=${encodeURIComponent(searchTerm.trim())}` : "";
      
      const url = `${serverUrl}/entries?${timeframeParams}${statusParam}${pageParam}${searchParam}`;
      
      console.log("Fetching entries from:", url);
      
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        
        console.log("API Response:", data);
        
        if (data.success && data.data) {
          // Set entries
          const fetchedEntries: Entry[] = data.data;
          setEntries(fetchedEntries);
          setPagination(data.pagination || null);
          
          
          // Set summary data
          if (data.summary) {
            setSummary(data.summary);
          }
          
          console.log(`Fetched ${fetchedEntries.length} entries with timeframe: ${data.timeframe?.description}`);
        } else {
          console.error("Unexpected API response format:", data);
          setEntries([]);
          setSummary(null);
          setError(t("entryHistory.unexpectedFormat"));
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Entries fetch failed:", res.status, errorData);
        setError(serverMessage(errorData.error, t("entryHistory.loadFailed", { status: res.status })));
        setEntries([]);
      }
    } catch (error) {
      console.error("Error loading entries:", error);
      setError(t("entryHistory.connectionFailed"));
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };
  fetchEntriesRef.current = fetchEntries;


  // Filter entries based on search term
  // Search is applied by the server before pagination and summary aggregation.
  const filteredEntries = showEditedEntries ? editedEntries : entries;

  const formatDate = (dateString: string) => formatDateTimeGMT2(dateString);

  const formatCurrency = (amount: number) => formatUSD(amount);

  const formatOriginalAmount = (entry: Entry) =>
    entry.enteredCurrency === "FC"
      ? `${(entry.enteredAmount ?? entry.amountFC ?? 0).toLocaleString(activeLocale())} FC (${t("entryHistory.equiv")} ${formatCurrency(entry.amountUSD ?? entry.amount)})`
      : formatCurrency(entry.enteredAmount ?? entry.amount);

  // Function to view edited entry details
  const viewEditedEntryDetails = (entry: Entry) => {
    setSelectedEditedEntry(entry);
    setShowEditedDetailsModal(true);
  };

  // Function to render change comparison
  const renderChangeComparison = (entry: Entry) => {
    if (!entry.editHistory || entry.editHistory.length === 0) return null;

    const latestEdit = entry.editHistory[entry.editHistory.length - 1];
    const changes = latestEdit.changes;

    return (
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
          <History className="w-4 h-4" aria-hidden="true" />
          {t("entryHistory.lastEdit")}
        </h4>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-yellow-700">{t("entryHistory.editedBy")}</span>
            <span className="font-medium">{latestEdit.editedBy || entry.editedBy || t("common.unknown")}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-yellow-700">{t("entryHistory.editDate")}</span>
            <span className="font-medium">{formatDate(latestEdit.editedAt || entry.editedAt || entry.updatedAt)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-yellow-700">{t("entryHistory.reason")}</span>
            <span className="font-medium text-right">{latestEdit.reason}</span>
          </div>

          {changes && Object.keys(changes).length > 0 && (
            <div className="mt-3 pt-3 border-t border-yellow-200">
              <h5 className="font-medium text-yellow-800 mb-2">{t("entryHistory.changesTitle")}</h5>
              {Object.entries(changes).map(([field, changeData]: [string, FieldChange]) => (
                <div key={field} className="mb-2 last:mb-0">
                  <div className="font-medium text-yellow-700">{fieldLabel(field)}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-red-50 p-2 rounded">
                      <div className="text-red-600 font-medium">{t("entryHistory.before")}</div>
                      <div className="truncate">{changeValue(changeData.from)}</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded">
                      <div className="text-green-600 font-medium">{t("entryHistory.after")}</div>
                      <div className="truncate">{changeValue(changeData.to)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Print function for entry receipt
  const esc = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
  const L = (key: string) => esc(t(`receipt.${key}`));
  const printEntryReceipt = (entry: Entry) => {
    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (printWindow) {
      printWindow.document.write(`
<html>
  <head>
    <title>${L("entryReceiptTitle")}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Courier New', Courier, monospace;
        margin: 0; padding: 0;
        font-size: 12px; font-weight: bold; line-height: 1.2;
        width: 80mm; background-color: white;
        -webkit-print-color-adjust: exact; print-color-adjust: exact;
      }
      .receipt-container { width: 78mm; margin: 0 auto; padding: 1mm 2mm; border: none; text-align: center; position: relative; }
      .logo-watermark { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: url('${window.location.origin}/logo.jpeg'); background-repeat: no-repeat; background-position: center; background-size: 65%; opacity: 0.18; pointer-events: none; z-index: 0; }
      .content-wrapper { position: relative; z-index: 1; }
      .header { text-align: center; margin-bottom: 2mm; padding-bottom: 1mm; border-bottom: 2px double #000; }
      .shop-name { font-size: 14px; font-weight: bold; margin-bottom: 0.5mm; text-transform: uppercase; }
      .shop-details { font-size: 10px; margin-bottom: 0.3mm; line-height: 1.2; font-weight: bold; }
      .receipt-info { margin: 2mm 0; padding: 1mm 2mm; background-color: #f8f8f8; border-left: 3px solid #000; text-align: left; }
      .receipt-title { font-size: 11px; font-weight: bold; margin: 1mm 0; text-transform: uppercase; background-color: #000; color: white; padding: 1mm 2mm; border-radius: 2px; text-align: center; }
      .entry-badge { background-color: #000; color: white; padding: 2mm; font-weight: bold; text-align: center; margin: 1mm 0; font-size: 13px; border-radius: 3px; }
      .details-section { margin: 0; padding: 0; background-color: #fafafa; border: none; }
      .detail-row { display: flex; justify-content: space-between; margin-bottom: 0.5mm; padding: 0.5mm 2mm; border-bottom: 1px dotted #ddd; font-size: 10px; }
      .detail-label { text-align: left; font-weight: bold; font-size: 10px; flex: 1; }
      .detail-value { text-align: right; font-weight: bold; font-size: 10px; flex: 1; }
      .amount-section { font-weight: bold; margin-top: 2mm; padding: 1mm 2mm; background-color: #f0f0f0; border: 1px solid #ddd; border-radius: 3px; }
      .amount-row { display: flex; justify-content: space-between; margin-bottom: 0.5mm; font-size: 11px; padding: 0 1mm; }
      .payment-method { text-transform: uppercase; font-weight: bold; font-size: 11px; color: #000; }
      .footer { text-align: center; margin-top: 2mm; font-size: 10px; font-weight: bold; padding: 1mm 2mm; background-color: #f8f8f8; border-top: 1px dashed #000; }
      .agent-info { margin-top: 2mm; text-align: center; font-weight: bold; font-size: 10px; padding: 1mm 2mm; background-color: #e8e8e8; border: 1px solid #ccc; border-radius: 2px; }
      .sender-info { margin: 2mm 0; padding: 1mm 2mm; font-weight: bold; text-align: left; background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 3px; font-size: 10px; }
      .sender-field { margin-bottom: 0.3mm; font-size: 10px; }
      .cut-line { text-align: center; margin: 2mm 0 0 0; font-weight: bold; font-size: 10px; color: #000; letter-spacing: 1px; }
      .thank-you { font-weight: bold; margin: 0.5mm 0; font-size: 10px; }
      .warning { font-size: 9px; color: #000; margin: 0.3mm 0; font-weight: bold; }
      .description { margin: 1mm 0; padding: 1mm 2mm; background-color: #f5f5f5; border-left: 3px solid #ccc; font-size: 10px; font-weight: bold; border-radius: 2px; text-align: left; }
      .section-divider { height: 2px; background: linear-gradient(to right, transparent, #000, transparent); margin: 1mm 0; }
      @media print {
        @page { margin: 0 !important; size: 80mm auto !important; }
        body { margin: 0 !important; padding: 0 !important; width: 80mm !important; font-size: 12px !important; background: white !important; font-weight: bold !important; height: auto !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .receipt-container { border: none !important; box-shadow: none !important; margin: 0 auto !important; padding: 1mm 2mm !important; width: 78mm !important; }
        .cut-line { page-break-after: always !important; margin-bottom: 0 !important; }
        body::after, body::before { display: none !important; content: none !important; }
      }
    </style>
  </head>
  <body>
    <div class="receipt-container">
      <div class="logo-watermark"></div>
      <div class="content-wrapper">
      <div class="header">
        <div class="shop-name"><strong>${shopSettings.shopName}</strong></div>
        <div class="shop-details"><strong>${shopSettings.shopAddress}</strong></div>
        <div class="shop-details">${L("tel")}: <strong>${shopSettings.shopNumber}</strong></div>
        <div class="shop-details"><strong>${shopSettings.shopRegistration}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">${L("date")}: <strong>${formatDate(entry.createdAt)}</strong></div>
        <div class="shop-details">${L("receiptNo")}: <strong>${entry.entryId}</strong></div>
      </div>
      
      <div class="entry-badge">
        <strong>💰 ${L("entryConfirmed")} 💰</strong>
      </div>
      
      <div class="sender-info">
        <div class="sender-field">${L("receivedFrom")}: <strong>${esc(entry.receivedFrom.name.toUpperCase())}</strong></div>
        <div class="sender-field">${L("phone")}: <strong>${esc(entry.receivedFrom.phone)}</strong></div>
        ${entry.receivedFrom.email ? `<div class="sender-field">${L("email")}: <strong>${esc(entry.receivedFrom.email)}</strong></div>` : ""}
      </div>
      
      ${entry.description ? `<div class="description"><strong>${L("description")}:</strong> <strong>${esc(entry.description)}</strong></div>` : ''}
      
      <div class="receipt-title">${L("entryDetails")}</div>
      
      <div class="details-section">
        <div class="detail-row">
          <div class="detail-label"><strong>${L("source")}:</strong></div>
          <div class="detail-value"><strong>${esc(entrySourceLabel(t, entry.source))}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>${L("category")}:</strong></div>
          <div class="detail-value"><strong>${esc(entryCategoryLabel(t, entry.category))}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>${L("paymentMethod")}:</strong></div>
          <div class="detail-value"><strong>${esc(uiPaymentLabel(t, entry.paymentMethod).toUpperCase())}</strong></div>
        </div>
      </div>
      
      <div class="amount-section">
        <div class="amount-row">
          <div><strong>${L("amountReceived")}:</strong></div>
          <div><strong>${formatOriginalAmount(entry)}</strong></div>
        </div>
      </div>
      
      <div class="agent-info">
        ${L("recordedBy")}: <strong>${esc((entry.createdBy?.username || t("entryHistory.notSpecified")).toUpperCase())}</strong>
      </div>
      
      <div class="footer">
        <div class="thank-you"><strong>${esc(shopSettings.receiptFooter === null ? t("receipt.defaultFooter") : shopSettings.receiptFooter || t("receipt.entrySaved"))}</strong></div>
        <div class="warning"><strong>${L("keepAsProof")}</strong></div>
      </div>

      <div class="cut-line">✄ ────────────────────────── ✄</div>
      </div>
    </div>
    <script>
      window.onload = function() {
        try { window.print(); } catch(e) { console.error('Print error:', e); }
        setTimeout(() => { window.close(); }, 1000);
      };
    </script>
  </body>
</html>
`);
      printWindow.document.close();
    }
  };

  const generateEntryPDF = (entry: Entry) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text("ETS. DIEU MERCI", 105, 10, { align: "center" });
    doc.setFontSize(10);
    doc.text("<<Chez Dan Collection>>", 105, 15, { align: "center" });
    const P = (text: string) => pdfSafe(text);
    doc.setFontSize(12);
    doc.text("RCCM: 14-A-017885", 105, 20, { align: "center" });
    doc.text(P(`${t("entryHistory.pdf.tel")}: +243 977 771 421 / +243 853 549 102`), 105, 25, { align: "center" });
    doc.text(P("Av Manono Coin Munama N°39,C.Kenya, Lubumbashi"), 105, 30, { align: "center" });

    doc.setFontSize(16);
    doc.text(P(t("entryHistory.pdf.title")), 105, 35, { align: "center" });

    // Entry Info
    doc.setFontSize(10);
    doc.text(P(`${t("common.date")}: ${formatDate(entry.createdAt)}`), 20, 45);
    doc.text(P(`${t("entryHistory.pdf.receiptNo")}: ${entry.entryId}`), 20, 52);
    doc.text(P(`${t("sortie.paymentMethod")}: ${uiPaymentLabel(t, entry.paymentMethod).toUpperCase()}`), 20, 59);
    doc.text(P(`${t("common.status")}: ${(entry.status === "active" ? t("common.active") : t("entryHistory.deleted")).toUpperCase()}`), 20, 66);

    // Created By Info
    doc.text(P(`${t("sortie.recordedBy")}: ${entry.createdBy?.username || t("entryHistory.notSpecified")}`), 20, 73);

    // Received From Info
    doc.setFontSize(12);
    doc.text(P(`${t("entry.sectionSender")}:`), 20, 85);
    doc.setFontSize(10);
    doc.text(P(`${t("entryHistory.name")}: ${entry.receivedFrom.name}`), 20, 92);
    doc.text(P(`${t("entryHistory.phone")}: ${entry.receivedFrom.phone}`), 20, 99);
    if (entry.receivedFrom.email) {
      doc.text(P(`${t("entryHistory.email")}: ${entry.receivedFrom.email}`), 20, 106);
    }

    // Entry Details
    doc.setFontSize(12);
    doc.text(P(`${t("entry.sectionMoney")}:`), 20, 113);
    doc.setFontSize(10);
    
    let yPos = 120;
    doc.text(P(`${t("entry.source")}: ${entrySourceLabel(t, entry.source)}`), 20, yPos); yPos += 7;
    doc.text(P(`${t("entry.category")}: ${entryCategoryLabel(t, entry.category)}`), 20, yPos); yPos += 7;
    doc.text(P(`${t("sortie.amount")}: ${formatOriginalAmount(entry)}`), 20, yPos); yPos += 7;
    
    if (entry.description) {
      yPos += 3;
      doc.text(P(`${t("entry.description")}: ${entry.description}`), 20, yPos); yPos += 10;
    }

    // Footer
    doc.setFontSize(10);
    doc.text(P(t("entryHistory.pdf.saved")), 105, yPos + 20, { align: "center" });
    doc.text(P(t("receipt.keepAsProof")), 105, yPos + 30, { align: "center" });
    doc.text(P(t("receipt.thanksTrust")), 105, yPos + 40, { align: "center" });

    doc.save(`entry-${entry.entryId}.pdf`);
  };

  const viewEntryDetails = (entry: Entry) => {
    setSelectedEntry(entry);
    setShowModal(true);
    setError(null);
  };

  const openEditModal = async (entry: Entry) => {
    if (entry.status === "deleted") {
      setError(t("entryHistory.cannotEditDeleted"));
      return;
    }

    setEditingEntry(entry);
    setEditForm({
      amount: entry.amount,
      source: entry.source,
      category: entry.category,
      paymentMethod: entry.paymentMethod as "cash" | "card" | "transfer" | "other",
      description: entry.description,
      receivedFrom: { ...entry.receivedFrom },
      reason: "",
    });
    setShowEditModal(true);
    setError(null);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingEntry(null);
    setEditForm({
      amount: 0,
      source: "",
      category: "",
      paymentMethod: "cash",
      description: "",
      receivedFrom: { name: "", phone: "", email: "" },
      reason: "",
    });
    setError(null);
  };

  const handleEditEntry = async () => {
    if (!editingEntry) return;

    if (!editForm.receivedFrom.name || !editForm.receivedFrom.phone) {
      setError(t("entryHistory.senderRequired"));
      return;
    }

    if (!editForm.reason) {
      setError(t("entryHistory.reasonRequired"));
      return;
    }

    try {
      setLoading(true);

      const updateData = {
        amount: editForm.amount,
        source: editForm.source,
        category: editForm.category,
        paymentMethod: editForm.paymentMethod,
        description: editForm.description,
        receivedFrom: editForm.receivedFrom,
        reason: editForm.reason,
      };

      console.log("Sending update data:", updateData);

      const response = await fetch(
        `${serverUrl}/entries/${editingEntry._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      console.log("Update response status:", response.status);

      if (response.ok) {
        const updatedEntry = await response.json();
        console.log("Updated entry:", updatedEntry);

        setMessage(t("entryHistory.updated"));
        await fetchEntries();
        closeEditModal();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Update error:", errorData);
        setError(serverMessage(errorData.error, t("entryHistory.updateFailedStatus", { status: response.status })));
      }
    } catch (error) {
      console.error("Error updating entry:", error);
      setError(t("entryHistory.updateFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entry: Entry) => {
    if (entry.status === "deleted") {
      setError(t("entryHistory.alreadyDeleted"));
      return;
    }

    if (!window.confirm(t("entryHistory.confirmDelete", { id: entry.entryId }))) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${serverUrl}/entries/${entry._id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      if (response.ok) {
        setMessage(t("entryHistory.deletedOk"));
        await fetchEntries();
        setShowModal(false);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(serverMessage(errorData.error, t("entryHistory.deleteFailed")));
      }
    } catch (error) {
      setError(t("entryHistory.deleteFailed"));
      console.error("Error deleting entry:", error);
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (entry: Entry) => (
    <span className={`badge ${entry.status === "active" ? "badge-success" : "badge-danger"}`}>
      {entry.status === "active" ? t("common.active") : t("entryHistory.deleted")}
    </span>
  );
  const fieldLabel = (field: string) => t(`entryHistory.fields.${field}`, { defaultValue: field.replace(/([A-Z])/g, " $1").toLowerCase() });
  const changeValue = (value: unknown) => value === null || value === undefined || value === ""
    ? t("common.notAvailable")
    : typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);

  // Summary statistics display component - ONLY VISIBLE TO ADMINS
  const SummaryStats = () => {
    if (!summary || !isAdmin) return null;
    return (
      <section aria-labelledby="entries-summary-title" className="grid gap-3 pt-4 mt-4 border-t border-gray-200">
        <h3 id="entries-summary-title" className="eyebrow">
          <Shield aria-hidden="true" />
          {t("entryHistory.summaryTitle")}
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="metric-card">
            <span className="metric-label">{t("entryHistory.kpi.entries")}</span>
            <span className="metric-value num">{formatNumber(summary.totalRecords, 0)}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">{t("entryHistory.kpi.total")}</span>
            <span className="metric-value num text-green-700">{formatCurrency(summary.totalAmount)}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">{t("entryHistory.kpi.active")}</span>
            <span className="metric-value num">{formatNumber(summary.active?.count || 0, 0)}</span>
            <span className="text-xs text-gray-500 num">{formatCurrency(summary.active?.amount || 0)}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">{t("entryHistory.kpi.methods")}</span>
            <span className="metric-value num">{Object.keys(summary.paymentMethods || {}).length}</span>
          </div>
        </div>
        {summary.paymentMethods && Object.keys(summary.paymentMethods).length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {Object.entries(summary.paymentMethods as Record<string, CountAmount>).map(([method, data]) => (
              <div key={method} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm num">
                <div className="flex justify-between gap-2">
                  <span className="font-medium text-gray-700 truncate">{uiPaymentLabel(t, method)}</span>
                  <span className="font-semibold text-gray-900">{data.count}</span>
                </div>
                <div className="text-xs text-gray-500">{formatCurrency(data.amount)}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  const listTitle = showEditedEntries ? t("entryHistory.editedEntries") : t("entryHistory.allEntries");

  return (
    <div className="page space-y-4">
      <PageHeader
        eyebrow={t("nav.sections.history")}
        icon={<History aria-hidden="true" />}
        title={t("entryHistory.title")}
        description={t("entryHistory.subtitle")}
        actions={<>
          <div className="input-group flex-1 sm:flex-none sm:w-72">
            <Search aria-hidden="true" />
            <input aria-label={t("entryHistory.searchLabel")} type="search" placeholder={t("entryHistory.searchPlaceholder")}
              className="input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button type="button" onClick={() => setShowEditedEntries(!showEditedEntries)} aria-pressed={showEditedEntries}
            className={`btn ${showEditedEntries ? "btn-primary" : "btn-secondary"}`}>
            <Filter aria-hidden="true" />
            {showEditedEntries ? t("entryHistory.allEntries") : t("entryHistory.editedEntries")}
            {showEditedEntries && <span className="badge num" style={{ background: "rgb(255 255 255 / 0.2)", color: "inherit", borderColor: "transparent" }}>{editedEntries.length}</span>}
          </button>
        </>}
      />

      <section className="card p-4" aria-labelledby="entries-period-title">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <h2 id="entries-period-title" className="section-title flex items-center gap-2 min-w-0">
            <Calendar className="w-4 h-4 text-gray-500 shrink-0" aria-hidden="true" />
            <span className="truncate">{listTitle} · {periodRange ? describePeriod(periodRange) : t("period.invalidShort")}</span>
          </h2>
          <button type="button" aria-label={t("common.refresh")} onClick={fetchEntries} disabled={loading} className="btn btn-secondary btn-sm">
            <RefreshCw className={loading ? "animate-spin" : ""} aria-hidden="true" />
            <span>{t("common.refresh")}</span>
          </button>
        </div>
        <div className="mt-3">
          <PeriodPicker value={periodSelection} onChange={setPeriodSelection} range={periodRange} />
        </div>
        <SummaryStats />
      </section>

      {message && (
        <div className="alert alert-success" role="status">
          <CheckCircle className="w-5 h-5" aria-hidden="true" />
          <span className="flex-1">{message}</span>
          <button type="button" aria-label={t("common.closeMessage")} onClick={() => setMessage(null)} className="btn btn-ghost btn-icon btn-sm -my-1 -mr-1"><X aria-hidden="true" /></button>
        </div>
      )}
      {error && !showEditModal && (
        <div className="alert alert-danger" role="alert">
          <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          <span className="flex-1">{error}</span>
          <button type="button" aria-label={t("common.closeMessage")} onClick={() => setError(null)} className="btn btn-ghost btn-icon btn-sm -my-1 -mr-1"><X aria-hidden="true" /></button>
        </div>
      )}

      <section className="card" aria-labelledby="entries-list-title">
        <div className="card-header">
          <h2 id="entries-list-title" className="section-title flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" aria-hidden="true" />
            {showEditedEntries ? t("entryHistory.editedEntries") : t("entryHistory.moneyEntries")}
            <span className="badge num">{filteredEntries.length}</span>
          </h2>
        </div>
        {loading ? (
          <LoadingState label={t("entryHistory.loading")} />
        ) : filteredEntries.length === 0 ? (
          <EmptyState title={showEditedEntries ? t("entryHistory.noEdited") : t("entryHistory.noEntries")} icon={<FileText aria-hidden="true" />}>
            {t("entryHistory.noResultPeriod")}
          </EmptyState>
        ) : (
          <ResponsiveTable className="report-table" aria-label={listTitle}>
            <thead>
              <tr>
                <th className="is-text">{t("entryHistory.col.id")}</th>
                <th className="is-text">{t("entryHistory.col.sender")}</th>
                <th className="is-text">{t("entry.source")}</th>
                <th className="is-text">{t("entry.category")}</th>
                <th className="is-num">{t("sortie.amount")}</th>
                <th className="is-text">{t("entryHistory.col.payment")}</th>
                <th className="is-text">{t("common.status")}</th>
                <th className="is-text">{t("common.date")}</th>
                {showEditedEntries && <th className="is-text">{t("entryHistory.lastEdit")}</th>}
                <th className="is-text is-actions">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry._id}>
                  <td className="is-text mono whitespace-nowrap"><strong>{entry.entryId}</strong></td>
                  <td className="is-text">
                    <div className="text-gray-900">{entry.receivedFrom.name}</div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">{entry.receivedFrom.phone}</div>
                  </td>
                  <td className="is-text">{entrySourceLabel(t, entry.source)}</td>
                  <td className="is-text">{entryCategoryLabel(t, entry.category)}</td>
                  <td className="num is-num whitespace-nowrap"><strong>{formatOriginalAmount(entry)}</strong></td>
                  <td className="is-text"><span className="badge">{uiPaymentLabel(t, entry.paymentMethod)}</span></td>
                  <td className="is-text">{statusBadge(entry)}</td>
                  <td className="is-text whitespace-nowrap text-gray-500">{formatDate(entry.createdAt)}</td>
                  {showEditedEntries && <td className="is-text whitespace-nowrap text-gray-500">{entry.editedAt ? formatDate(entry.editedAt) : t("common.notAvailable")}</td>}
                  <td className="is-text is-actions">
                    <div className="flex gap-1 whitespace-nowrap">
                      {showEditedEntries ? (
                        <button type="button" aria-label={t("entryHistory.viewChanges")} title={t("entryHistory.viewChanges")} onClick={() => viewEditedEntryDetails(entry)} className="btn btn-ghost btn-sm">
                          <History aria-hidden="true" /><span className="ui-action-label">{t("entryHistory.changes")}</span>
                        </button>
                      ) : (
                        <button type="button" aria-label={t("entryHistory.viewDetails")} title={t("entryHistory.viewDetails")} onClick={() => viewEntryDetails(entry)} className="btn btn-ghost btn-sm">
                          <Eye aria-hidden="true" /><span className="ui-action-label">{t("common.details")}</span>
                        </button>
                      )}
                      {!showEditedEntries && (
                        <>
                          <button type="button" aria-label={t("entryHistory.editEntry")} title={t("entryHistory.editEntry")} onClick={() => openEditModal(entry)} disabled={entry.status === "deleted"} className="btn btn-ghost btn-sm">
                            <Edit aria-hidden="true" /><span className="ui-action-label">{t("common.edit")}</span>
                          </button>
                          <button type="button" aria-label={t("entryHistory.downloadPdf")} title={t("entryHistory.downloadPdf")} onClick={() => generateEntryPDF(entry)} className="btn btn-ghost btn-sm">
                            <Download aria-hidden="true" /><span className="ui-action-label">PDF</span>
                          </button>
                          <button type="button" aria-label={t("entryHistory.printReceipt")} title={t("entryHistory.printReceipt")} onClick={() => printEntryReceipt(entry)} className="btn btn-ghost btn-sm">
                            <Printer aria-hidden="true" /><span className="ui-action-label">{t("common.print")}</span>
                          </button>
                          <button type="button" aria-label={t("entryHistory.deleteEntry")} title={t("entryHistory.deleteEntry")} onClick={() => handleDeleteEntry(entry)} disabled={entry.status === "deleted"} className="btn btn-ghost btn-sm text-red-600">
                            <Trash2 aria-hidden="true" /><span className="ui-action-label">{t("common.delete")}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        )}
      </section>

      {pagination && pagination.totalPages > 1 && (
        <nav className="card flex flex-wrap items-center justify-between gap-3 px-4 py-3" aria-label={t("entryHistory.pagination")}>
          <span className="text-sm text-gray-600 num">
            {t("common.page", { page: pagination.page, pages: pagination.totalPages })} · {t("entryHistory.recordCount", { count: pagination.totalRecords })}
          </span>
          <div className="flex gap-2">
            <button type="button" disabled={!pagination.hasPreviousPage} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="btn btn-secondary btn-sm">{t("common.previous")}</button>
            <button type="button" disabled={!pagination.hasNextPage} onClick={() => setCurrentPage((page) => page + 1)} className="btn btn-secondary btn-sm">{t("common.next")}</button>
          </div>
        </nav>
      )}

      {showModal && selectedEntry && (
        <Dialog label={t("entryHistory.detailsTitle")} onClose={() => setShowModal(false)}>
          <div className="dialog-panel max-w-2xl">
            <header className="dialog-head">
              <div>
                <h3 className="dialog-title">{t("entryHistory.detailsTitle")}</h3>
                <p className="dialog-subtitle mono">{selectedEntry.entryId}</p>
              </div>
              <button type="button" aria-label={t("common.close")} onClick={() => setShowModal(false)} className="btn btn-ghost btn-icon btn-sm"><X aria-hidden="true" /></button>
            </header>
            <div className="dialog-body space-y-4">
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div><dt className="text-gray-500">{t("common.date")}</dt><dd className="font-medium">{formatDate(selectedEntry.createdAt)}</dd></div>
                <div><dt className="text-gray-500">{t("sortie.paymentMethod")}</dt><dd className="font-medium">{uiPaymentLabel(t, selectedEntry.paymentMethod)}</dd></div>
                <div><dt className="text-gray-500">{t("common.status")}</dt><dd>{statusBadge(selectedEntry)}</dd></div>
                <div><dt className="text-gray-500">{t("sortie.recordedBy")}</dt><dd className="font-medium">{selectedEntry.createdBy?.username || t("entryHistory.notSpecified")}</dd></div>
                {selectedEntry.editedBy && (
                  <div className="col-span-2"><dt className="text-gray-500">{t("entryHistory.lastEdit")}</dt>
                    <dd className="font-medium">{t("entryHistory.editedByAt", { name: selectedEntry.editedBy, date: selectedEntry.editedAt ? formatDate(selectedEntry.editedAt) : t("common.notAvailable") })}</dd></div>
                )}
              </dl>

              <section className="form-section">
                <h4 className="section-title flex items-center gap-2"><User className="w-4 h-4" aria-hidden="true" />{t("entry.sectionSender")}</h4>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-gray-500">{t("entryHistory.name")}</dt><dd className="font-medium">{selectedEntry.receivedFrom.name}</dd></div>
                  <div><dt className="text-gray-500">{t("entryHistory.phone")}</dt><dd className="font-medium">{selectedEntry.receivedFrom.phone}</dd></div>
                  {selectedEntry.receivedFrom.email && <div className="col-span-2"><dt className="text-gray-500">{t("entryHistory.email")}</dt><dd className="font-medium">{selectedEntry.receivedFrom.email}</dd></div>}
                </dl>
              </section>

              <section className="form-section">
                <h4 className="section-title flex items-center gap-2"><DollarSign className="w-4 h-4" aria-hidden="true" />{t("entry.sectionMoney")}</h4>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div><dt className="text-gray-500">{t("entry.source")}</dt><dd className="font-medium">{entrySourceLabel(t, selectedEntry.source)}</dd></div>
                  <div><dt className="text-gray-500">{t("entry.category")}</dt><dd className="font-medium">{entryCategoryLabel(t, selectedEntry.category)}</dd></div>
                  <div><dt className="text-gray-500">{t("sortie.amount")}</dt><dd className="font-semibold num">{formatOriginalAmount(selectedEntry)}</dd></div>
                  {selectedEntry.description && <div className="col-span-full"><dt className="text-gray-500">{t("entry.description")}</dt><dd>{selectedEntry.description}</dd></div>}
                </dl>
              </section>

              {selectedEntry.editHistory && selectedEntry.editHistory.length > 0 && renderChangeComparison(selectedEntry)}
            </div>
            <footer className="dialog-foot flex-wrap">
              <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">{t("common.close")}</button>
              <button type="button" onClick={() => openEditModal(selectedEntry)} disabled={selectedEntry.status === "deleted"} className="btn btn-secondary"><Edit aria-hidden="true" />{t("entryHistory.editEntry")}</button>
              <button type="button" onClick={() => generateEntryPDF(selectedEntry)} className="btn btn-secondary"><Download aria-hidden="true" />{t("entryHistory.downloadPdf")}</button>
              <button type="button" onClick={() => printEntryReceipt(selectedEntry)} className="btn btn-primary"><Printer aria-hidden="true" />{t("entryHistory.printReceipt")}</button>
            </footer>
          </div>
        </Dialog>
      )}

      {showEditedDetailsModal && selectedEditedEntry && (
        <Dialog label={t("entryHistory.changeDetails")} onClose={() => setShowEditedDetailsModal(false)}>
          <div className="dialog-panel max-w-4xl">
            <header className="dialog-head">
              <div>
                <h3 className="dialog-title">{t("entryHistory.changeDetails")}</h3>
                <p className="dialog-subtitle mono">{selectedEditedEntry.entryId}</p>
              </div>
              <button type="button" aria-label={t("common.close")} onClick={() => setShowEditedDetailsModal(false)} className="btn btn-ghost btn-icon btn-sm"><X aria-hidden="true" /></button>
            </header>
            <div className="dialog-body space-y-4">
              <section className="form-section">
                <h4 className="section-title">{t("entryHistory.currentState")}</h4>
                <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  <div><dt className="text-gray-500">{t("entryHistory.col.sender")}</dt><dd className="font-medium">{selectedEditedEntry.receivedFrom.name} ({selectedEditedEntry.receivedFrom.phone})</dd></div>
                  <div><dt className="text-gray-500">{t("entryHistory.currentAmount")}</dt><dd className="font-semibold num">{formatCurrency(selectedEditedEntry.amount)}</dd></div>
                  <div><dt className="text-gray-500">{t("entry.source")}</dt><dd className="font-medium">{entrySourceLabel(t, selectedEditedEntry.source)}</dd></div>
                  <div><dt className="text-gray-500">{t("entry.category")}</dt><dd className="font-medium">{entryCategoryLabel(t, selectedEditedEntry.category)}</dd></div>
                </dl>
              </section>
              <section className="space-y-3">
                <h4 className="section-title">{t("entryHistory.editHistory")}</h4>
                {selectedEditedEntry.editHistory && selectedEditedEntry.editHistory.length > 0 ? (
                  selectedEditedEntry.editHistory.map((edit, index) => (
                    <article key={edit._id || index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="flex flex-wrap justify-between gap-2 mb-2">
                        <div>
                          <h5 className="font-medium text-gray-900">{t("entryHistory.editNumber", { n: selectedEditedEntry.editHistory!.length - index })}</h5>
                          <p className="text-sm text-gray-600">{formatDate(edit.editedAt)}</p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-medium text-gray-900">{t("entryHistory.by", { name: edit.editedBy })}</p>
                          <p className="text-gray-600">{t("entryHistory.reasonValue", { reason: edit.reason })}</p>
                        </div>
                      </div>
                      {edit.changes && Object.keys(edit.changes).length > 0 && (
                        <div className="space-y-2">
                          {Object.entries(edit.changes).map(([field, changeData]: [string, FieldChange]) => (
                            <div key={field} className="border-l-4 border-blue-500 pl-3">
                              <div className="font-medium text-gray-700 text-sm mb-1">{fieldLabel(field)}</div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div className="bg-red-50 p-2 rounded border border-red-200">
                                  <div className="text-red-700 font-medium">{t("entryHistory.before")}</div>
                                  <div className="text-red-600 break-words whitespace-pre-wrap">{changeValue(changeData.from)}</div>
                                </div>
                                <div className="bg-green-50 p-2 rounded border border-green-200">
                                  <div className="text-green-700 font-medium">{t("entryHistory.after")}</div>
                                  <div className="text-green-600 break-words whitespace-pre-wrap">{changeValue(changeData.to)}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  ))
                ) : (
                  <EmptyState title={t("entryHistory.noChangeDetails")} icon={<History aria-hidden="true" />} />
                )}
              </section>
            </div>
            <footer className="dialog-foot">
              <button type="button" onClick={() => setShowEditedDetailsModal(false)} className="btn btn-secondary">{t("common.close")}</button>
            </footer>
          </div>
        </Dialog>
      )}

      {showEditModal && editingEntry && (
        <Dialog label={t("entryHistory.editEntry")} onClose={closeEditModal}>
          <div className="dialog-panel max-w-3xl">
            <header className="dialog-head">
              <div>
                <h3 className="dialog-title">{t("entryHistory.editEntry")}</h3>
                <p className="dialog-subtitle mono">{editingEntry.entryId}</p>
              </div>
              <button type="button" aria-label={t("common.close")} onClick={closeEditModal} className="btn btn-ghost btn-icon btn-sm"><X aria-hidden="true" /></button>
            </header>
            <div className="dialog-body space-y-4">
              {error && <div className="alert alert-danger" role="alert"><AlertTriangle aria-hidden="true" /><span>{error}</span></div>}
              <fieldset className="form-section">
                <legend>{t("entry.sectionMoney")}</legend>
                <div className="form-row">
                  <label className="field">
                    <span className="field-label">{t("entryHistory.amountUsd")} *</span>
                    <input className="input num" type="number" step="0.01" value={editForm.amount} required
                      onChange={(e) => setEditForm((prev) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))} />
                  </label>
                  <label className="field">
                    <span className="field-label">{t("entry.source")} *</span>
                    <select className="input" value={editForm.source} required onChange={(e) => setEditForm((prev) => ({ ...prev, source: e.target.value }))}>
                      <option value="">{t("entry.selectSource")}</option>
                      {sources.map((source) => <option key={source} value={source}>{entrySourceLabel(t, source)}</option>)}
                    </select>
                  </label>
                  <label className="field">
                    <span className="field-label">{t("entry.category")} *</span>
                    <select className="input" value={editForm.category} required onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}>
                      <option value="">{t("entry.selectCategory")}</option>
                      {categories.map((category) => <option key={category} value={category}>{entryCategoryLabel(t, category)}</option>)}
                    </select>
                  </label>
                  <label className="field">
                    <span className="field-label">{t("sortie.paymentMethod")} *</span>
                    <select className="input" value={editForm.paymentMethod} required
                      onChange={(e) => setEditForm((prev) => ({ ...prev, paymentMethod: e.target.value as "cash" | "card" | "transfer" | "other" }))}>
                      {(["cash", "card", "transfer", "other"] as const).map((value) => <option key={value} value={value}>{uiPaymentLabel(t, value)}</option>)}
                    </select>
                  </label>
                </div>
                <label className="field">
                  <span className="field-label">{t("entry.description")}</span>
                  <textarea className="input" rows={2} value={editForm.description} placeholder={t("entry.descriptionPlaceholder")}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))} />
                </label>
              </fieldset>
              <fieldset className="form-section">
                <legend>{t("entry.sectionSender")}</legend>
                <div className="form-row">
                  <label className="field">
                    <span className="field-label">{t("entryHistory.name")} *</span>
                    <input className="input" type="text" required value={editForm.receivedFrom.name}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, receivedFrom: { ...prev.receivedFrom, name: e.target.value } }))} />
                  </label>
                  <label className="field">
                    <span className="field-label">{t("entryHistory.phone")} *</span>
                    <input className="input" type="tel" required value={editForm.receivedFrom.phone}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, receivedFrom: { ...prev.receivedFrom, phone: e.target.value } }))} />
                  </label>
                  <label className="field">
                    <span className="field-label">{t("entryHistory.email")}</span>
                    <input className="input" type="email" value={editForm.receivedFrom.email}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, receivedFrom: { ...prev.receivedFrom, email: e.target.value } }))} />
                  </label>
                </div>
              </fieldset>
              <label className="field">
                <span className="field-label">{t("entryHistory.editReason")} *</span>
                <textarea className="input" rows={2} required value={editForm.reason} placeholder={t("entryHistory.editReasonPlaceholder")}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, reason: e.target.value }))} />
              </label>
            </div>
            <footer className="dialog-foot">
              <button type="button" onClick={closeEditModal} className="btn btn-secondary">{t("common.cancel")}</button>
              <button type="button" onClick={handleEditEntry} disabled={loading} className="btn btn-primary">
                {loading ? <RefreshCw className="animate-spin" aria-hidden="true" /> : <Edit aria-hidden="true" />}
                {loading ? t("entryHistory.updating") : t("entryHistory.update")}
              </button>
            </footer>
          </div>
        </Dialog>
      )}
    </div>
  );
}
