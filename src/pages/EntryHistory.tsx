"use client";
import ResponsiveTable from "../components/ui/ResponsiveTable";
import Dialog from "../components/ui/Dialog";
import { EmptyState, LoadingState } from "../components/ui/States";

import { useState, useEffect } from "react";
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

interface EditHistoryEntry {
  editedBy: string;
  editedAt: string;
  changes: any;
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
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopSettings, setShopSettings] = useState({
    shopName: "ETS. DIEU MERCI",
    shopAddress: "Av Manono Coin Munama N°39, C. Kenya, Lubumbashi",
    shopNumber: "+243 977 771 421 / +243 853 549 102",
    shopRegistration: "RCCM: 14-A-017885",
    receiptFooter: "Merci pour votre confiance ! À bientôt.",
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
  useEffect(() => {
    fetchCurrentUser();
    fetchEntries();
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
      fetchEntries();
    }
  }, [periodKey, showEditedEntries, currentUser, currentPage, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [periodKey, showEditedEntries, searchTerm]);

  // Update edited entries when entries change
  useEffect(() => {
    updateEditedEntries();
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
          setError("Format de réponse API inattendu");
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: "Erreur serveur" }));
        console.error("Entries fetch failed:", res.status, errorData);
        setError(errorData.error || `Échec du chargement (${res.status})`);
        setEntries([]);
      }
    } catch (error) {
      console.error("Error loading entries:", error);
      setError("Échec de la connexion au serveur");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };


  // Filter entries based on search term
  // Search is applied by the server before pagination and summary aggregation.
  const filteredEntries = showEditedEntries ? editedEntries : entries;

  const formatDate = (dateString: string) => formatDateTimeGMT2(dateString);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatOriginalAmount = (entry: Entry) =>
    entry.enteredCurrency === "FC"
      ? `${(entry.enteredAmount ?? entry.amountFC ?? 0).toLocaleString("fr-FR")} FC (Équiv. ${formatCurrency(entry.amountUSD ?? entry.amount)})`
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
          <History className="w-4 h-4" />
          Dernière modification
        </h4>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-yellow-700">Modifié par:</span>
            <span className="font-medium">{latestEdit.editedBy || entry.editedBy || "Unknown"}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-yellow-700">Date de modification:</span>
            <span className="font-medium">{formatDate(latestEdit.editedAt || entry.editedAt || entry.updatedAt)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-yellow-700">Raison:</span>
            <span className="font-medium text-right">{latestEdit.reason}</span>
          </div>

          {changes && Object.keys(changes).length > 0 && (
            <div className="mt-3 pt-3 border-t border-yellow-200">
              <h5 className="font-medium text-yellow-800 mb-2">Changements:</h5>
              {Object.entries(changes).map(([field, changeData]: [string, any]) => (
                <div key={field} className="mb-2 last:mb-0">
                  <div className="font-medium text-yellow-700 capitalize">
                    {field.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-red-50 p-2 rounded">
                      <div className="text-red-600 font-medium">Avant:</div>
                      <div className="truncate">{JSON.stringify(changeData.from)}</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded">
                      <div className="text-green-600 font-medium">Après:</div>
                      <div className="truncate">{JSON.stringify(changeData.to)}</div>
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
  const printEntryReceipt = (entry: Entry) => {
    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (printWindow) {
      printWindow.document.write(`
<html>
  <head>
    <title>Reçu d'Entrée d'Argent</title>
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
        <div class="shop-details">TEL: <strong>${shopSettings.shopNumber}</strong></div>
        <div class="shop-details"><strong>${shopSettings.shopRegistration}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">DATE: <strong>${formatDate(entry.createdAt)}</strong></div>
        <div class="shop-details">REÇU #: <strong>${entry.entryId}</strong></div>
      </div>
      
      <div class="entry-badge">
        <strong>💰 ENTRÉE D'ARGENT CONFIRMÉE 💰</strong>
      </div>
      
      <div class="sender-info">
        <div class="sender-field">REÇU DE: <strong>${entry.receivedFrom.name.toUpperCase()}</strong></div>
        <div class="sender-field">TÉLÉPHONE: <strong>${entry.receivedFrom.phone}</strong></div>
        ${entry.receivedFrom.email ? `<div class="sender-field">EMAIL: <strong>${entry.receivedFrom.email}</strong></div>` : ""}
      </div>
      
      ${entry.description ? `<div class="description"><strong>DESCRIPTION:</strong> <strong>${entry.description}</strong></div>` : ''}
      
      <div class="receipt-title">DÉTAILS DE L'ENTRÉE</div>
      
      <div class="details-section">
        <div class="detail-row">
          <div class="detail-label"><strong>SOURCE:</strong></div>
          <div class="detail-value"><strong>${entry.source}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>CATÉGORIE:</strong></div>
          <div class="detail-value"><strong>${entry.category}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>MÉTHODE PAIEMENT:</strong></div>
          <div class="detail-value"><strong>${entry.paymentMethod.toUpperCase()}</strong></div>
        </div>
      </div>
      
      <div class="amount-section">
        <div class="amount-row">
          <div><strong>MONTANT REÇU:</strong></div>
          <div><strong>${formatOriginalAmount(entry)}</strong></div>
        </div>
      </div>
      
      <div class="agent-info">
        Enregistré par: <strong>${(entry.createdBy?.username || 'Non spécifié').toUpperCase()}</strong>
      </div>
      
      <div class="footer">
        <div class="thank-you"><strong>${shopSettings.receiptFooter || "ENTRÉE ENREGISTRÉE AVEC SUCCÈS !"}</strong></div>
        <div class="warning"><strong>Conserver ce reçu comme preuve</strong></div>
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
    doc.setFontSize(12);
    doc.text("RCCM: 14-A-017885", 105, 20, { align: "center" });
    doc.text("Tél: +243 977 771 421 / +243 853 549 102", 105, 25, { align: "center" });
    doc.text("Av Manono Coin Munama N°39,C.Kenya, Lubumbashi", 105, 30, { align: "center" });

    doc.setFontSize(16);
    doc.text("Reçu d'entrée d'argent", 105, 35, { align: "center" });

    // Entry Info
    doc.setFontSize(10);
    doc.text(`Date: ${formatDate(entry.createdAt)}`, 20, 45);
    doc.text(`Reçu #: ${entry.entryId}`, 20, 52);
    doc.text(`Méthode de paiement: ${entry.paymentMethod.toUpperCase()}`, 20, 59);
    doc.text(`Statut: ${entry.status.toUpperCase()}`, 20, 66);

    // Created By Info
    doc.text(`Enregistré par: ${entry.createdBy?.username || "Non spécifié"}`, 20, 73);

    // Received From Info
    doc.setFontSize(12);
    doc.text("Information sur l'expéditeur:", 20, 85);
    doc.setFontSize(10);
    doc.text(`Nom: ${entry.receivedFrom.name}`, 20, 92);
    doc.text(`Téléphone: ${entry.receivedFrom.phone}`, 20, 99);
    if (entry.receivedFrom.email) {
      doc.text(`Email: ${entry.receivedFrom.email}`, 20, 106);
    }

    // Entry Details
    doc.setFontSize(12);
    doc.text("Détails de l'entrée:", 20, 113);
    doc.setFontSize(10);
    
    let yPos = 120;
    doc.text(`Source: ${entry.source}`, 20, yPos); yPos += 7;
    doc.text(`Catégorie: ${entry.category}`, 20, yPos); yPos += 7;
    doc.text(`Montant: ${formatOriginalAmount(entry)}`, 20, yPos); yPos += 7;
    
    if (entry.description) {
      yPos += 3;
      doc.text(`Description: ${entry.description}`, 20, yPos); yPos += 10;
    }

    // Footer
    doc.setFontSize(10);
    doc.text("Entrée enregistrée avec succès !", 105, yPos + 20, { align: "center" });
    doc.text("Conserver ce reçu comme preuve.", 105, yPos + 30, { align: "center" });
    doc.text("Merci pour votre confiance", 105, yPos + 40, { align: "center" });

    doc.save(`entry-${entry.entryId}.pdf`);
  };

  const viewEntryDetails = (entry: Entry) => {
    setSelectedEntry(entry);
    setShowModal(true);
    setError(null);
  };

  const openEditModal = async (entry: Entry) => {
    if (entry.status === "deleted") {
      setError("Cannot edit a deleted entry");
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
      setError("Le nom et le téléphone de l'expéditeur sont requis");
      return;
    }

    if (!editForm.reason) {
      setError("Veuillez fournir une raison pour la modification de cette entrée");
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

        setMessage("Entrée mise à jour avec succès.");
        await fetchEntries();
        closeEditModal();
      } else {
        const errorData = await response.json();
        console.error("Update error:", errorData);
        setError(errorData.error || `Échec de la mise à jour: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error updating entry:", error);
      setError("Échec de la mise à jour de l'entrée. Veuillez vérifier votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entry: Entry) => {
    if (entry.status === "deleted") {
      setError("L'entrée est déjà supprimée");
      return;
    }

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'entrée ${entry.entryId}? Cette action ne peut pas être annulée.`)) {
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
        setMessage("Entrée supprimée avec succès.");
        await fetchEntries();
        setShowModal(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Échec de la suppression de l'entrée");
      }
    } catch (error) {
      setError("Échec de la suppression de l'entrée");
      console.error("Error deleting entry:", error);
    } finally {
      setLoading(false);
    }
  };

  // Summary statistics display component - ONLY VISIBLE TO ADMINS
  const SummaryStats = () => {
    if (!summary || !isAdmin) return null;

    return (
      <section aria-labelledby="entries-summary-title" className="grid gap-3 pt-4 mt-4 border-t border-gray-200">
        <h3 id="entries-summary-title" className="eyebrow">
          <Shield aria-hidden="true" />
          Synthèse de la période · vue administrateur
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="metric-card">
            <span className="metric-label">Entrées</span>
            <span className="metric-value">{summary.totalRecords}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Montant total</span>
            <span className="metric-value text-green-700">{formatCurrency(summary.totalAmount)}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Entrées actives</span>
            <span className="metric-value">{summary.active?.count || 0}</span>
            <span className="text-xs text-gray-500 num">{formatCurrency(summary.active?.amount || 0)}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Méthodes de paiement</span>
            <span className="metric-value">{Object.keys(summary.paymentMethods || {}).length}</span>
          </div>
        </div>
        {summary.paymentMethods && Object.keys(summary.paymentMethods).length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {Object.entries(summary.paymentMethods).map(([method, data]: [string, any]) => (
              <div key={method} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm num">
                <div className="flex justify-between gap-2">
                  <span className="font-medium text-gray-700 capitalize truncate">{method}</span>
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

  return (
    <div className="page space-y-5">
      <header className="page-header">
        <div>
          <h1 className="page-title">Historique des entrées</h1>
          <p className="page-subtitle">Entrées d'argent enregistrées, reçus et modifications.</p>
        </div>
        <div className="page-actions w-full sm:w-auto">
          <div className="input-group flex-1 sm:flex-none sm:w-72">
            <Search aria-hidden="true" />
            <input aria-label="Rechercher une entrée"
              type="search"
              placeholder="Identifiant, expéditeur, source…"
              className="input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowEditedEntries(!showEditedEntries)}
            aria-pressed={showEditedEntries}
            className={`btn ${showEditedEntries ? "btn-primary" : "btn-secondary"}`}
          >
            <Filter aria-hidden="true" />
            {showEditedEntries ? "Toutes les entrées" : "Entrées modifiées"}
            {showEditedEntries && (
              <span className="badge num" style={{ background: "rgb(255 255 255 / 0.2)", color: "inherit", borderColor: "transparent" }}>
                {editedEntries.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Timeframe Filter Section */}
      <section className="card p-4 sm:p-5" aria-labelledby="entries-period-title">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <h2 id="entries-period-title" className="section-title flex items-center gap-2 min-w-0">
            <Calendar className="w-4 h-4 text-gray-500 shrink-0" aria-hidden="true" />
            <span className="truncate">{showEditedEntries ? "Entrées modifiées" : "Toutes les entrées"} · {periodRange ? describePeriod(periodRange) : "Période invalide"}</span>
          </h2>
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
            {/* Refresh Button */}
            <button type="button" aria-label="Actualiser"
              onClick={fetchEntries}
              disabled={loading}
              className="btn btn-secondary"
            >
              <RefreshCw className={loading ? 'animate-spin' : ''} aria-hidden="true" />
              <span className="sm:hidden">Actualiser</span>
            </button>
          </div>
        </div>

        <div className="mt-4">
          <PeriodPicker value={periodSelection} onChange={setPeriodSelection} range={periodRange} />
        </div>

        {/* Show summary statistics - Admin only */}
        <SummaryStats />
      </section>

      {message && (
        <div className="alert alert-success" role="status">
          <CheckCircle className="w-5 h-5" aria-hidden="true" />
          <span className="flex-1">{message}</span>
          <button type="button" aria-label="Fermer le message" onClick={() => setMessage(null)} className="btn btn-ghost btn-icon btn-sm -my-1 -mr-1">
            <X aria-hidden="true" />
          </button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          <span className="flex-1">{error}</span>
          <button type="button" aria-label="Fermer le message" onClick={() => setError(null)} className="btn btn-ghost btn-icon btn-sm -my-1 -mr-1">
            <X aria-hidden="true" />
          </button>
        </div>
      )}

      <section className="card" aria-labelledby="entries-list-title">
        <div className="card-header">
          <h2 id="entries-list-title" className="section-title flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" aria-hidden="true" />
            {showEditedEntries ? "Entrées modifiées" : "Entrées d'argent"}
            <span className="badge num">{filteredEntries.length}</span>
          </h2>
        </div>

        <div>
          {loading ? (
            <LoadingState label="Chargement des entrées…" />
          ) : filteredEntries.length === 0 ? (
            <EmptyState title={showEditedEntries ? "Aucune entrée modifiée" : "Aucune entrée trouvée"} icon={<FileText aria-hidden="true" />}>
              Aucun résultat pour la période sélectionnée.
            </EmptyState>
          ) : (
            <ResponsiveTable className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Entrée
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expéditeur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paiement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  {showEditedEntries && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dernière modification
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntries.map((entry) => (
                  <tr key={entry._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.entryId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {entry.receivedFrom.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {entry.receivedFrom.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatOriginalAmount(entry)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {entry.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          entry.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {entry.status === "active" ? "Actif" : "Supprimé"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(entry.createdAt)}
                    </td>
                    {showEditedEntries && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.editedAt ? formatDate(entry.editedAt) : "N/A"}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {showEditedEntries ? (
                          <button aria-label="Voir les détails des modifications"
                            onClick={() => viewEditedEntryDetails(entry)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Voir les détails des modifications"
                          >
                            <History className="w-4 h-4" aria-hidden="true" /><span className="ui-action-label">Modifications</span>
                          </button>
                        ) : (
                          <button aria-label="Voir les détails"
                            onClick={() => viewEntryDetails(entry)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" aria-hidden="true" /><span className="ui-action-label">Détails</span>
                          </button>
                        )}
                        {!showEditedEntries && (
                          <>
                            <button aria-label="Modifier l'entrée"
                              onClick={() => openEditModal(entry)}
                              disabled={entry.status === "deleted"}
                              className={`p-1 rounded ${
                                entry.status === "deleted"
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-yellow-600 hover:text-yellow-900"
                              }`}
                              title="Modifier l'entrée"
                            >
                              <Edit className="w-4 h-4" aria-hidden="true" /><span className="ui-action-label">Modifier</span>
                            </button>
                            <button aria-label="Télécharger PDF"
                              onClick={() => generateEntryPDF(entry)}
                              className="text-green-600 hover:text-green-900 p-1 rounded"
                              title="Télécharger PDF"
                            >
                              <Download className="w-4 h-4" aria-hidden="true" /><span className="ui-action-label">PDF</span>
                            </button>
                            <button aria-label="Imprimer le reçu"
                              onClick={() => printEntryReceipt(entry)}
                              className="text-purple-600 hover:text-purple-900 p-1 rounded"
                              title="Imprimer le reçu"
                            >
                              <Printer className="w-4 h-4" aria-hidden="true" /><span className="ui-action-label">Imprimer</span>
                            </button>
                            <button aria-label="Supprimer l'entrée"
                              onClick={() => handleDeleteEntry(entry)}
                              disabled={entry.status === "deleted"}
                              className={`p-1 rounded ${
                                entry.status === "deleted"
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-red-600 hover:text-red-900"
                              }`}
                              title="Supprimer l'entrée"
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" /><span className="ui-action-label">Supprimer</span>
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
        </div>
      </section>

      {pagination && pagination.totalPages > 1 && (
        <nav className="card flex flex-wrap items-center justify-between gap-3 px-4 py-3" aria-label="Pagination des entrées">
          <span className="text-sm text-gray-600 num">
            Page {pagination.page} sur {pagination.totalPages} · {pagination.totalRecords} entrées
          </span>
          <div className="flex gap-2">
            <button type="button" disabled={!pagination.hasPreviousPage} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="btn btn-secondary btn-sm">Précédent</button>
            <button type="button" disabled={!pagination.hasNextPage} onClick={() => setCurrentPage((page) => page + 1)} className="btn btn-secondary btn-sm">Suivant</button>
          </div>
        </nav>
      )}

      {/* Entry Details Modal */}
      {showModal && selectedEntry && (
        <Dialog label="Détails de l'Entrée" onClose={() => setShowModal(false)}>
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Détails de l'Entrée
              </h3>
              <button type="button" aria-label="Fermer"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Entry Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Entrée
                  </label>
                  <p className="text-sm text-gray-900">{selectedEntry.entryId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <p className="text-sm text-gray-900">
                    {formatDate(selectedEntry.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Méthode de Paiement
                  </label>
                  <p className="text-sm text-gray-900 capitalize">
                    {selectedEntry.paymentMethod}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      selectedEntry.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedEntry.status === "active" ? "Actif" : "Supprimé"}
                  </span>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enregistré par
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedEntry.createdBy?.username || "Non spécifié"}
                  </p>
                </div>
                {selectedEntry.editedBy && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dernière modification
                    </label>
                    <p className="text-sm text-gray-900">
                      Par: {selectedEntry.editedBy} à{" "}
                      {selectedEntry.editedAt
                        ? formatDate(selectedEntry.editedAt)
                        : "N/A"}
                    </p>
                  </div>
                )}
              </div>

              {/* Received From Info */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Information sur l'Expéditeur
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedEntry.receivedFrom.name}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedEntry.receivedFrom.phone}
                      </p>
                    </div>
                    {selectedEntry.receivedFrom.email && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <p className="text-sm text-gray-900">
                          {selectedEntry.receivedFrom.email}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Entry Details */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Détails de l'Entrée
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Source:</span>
                    <span className="text-gray-900">{selectedEntry.source}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Catégorie:</span>
                    <span className="text-gray-900">{selectedEntry.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Montant:</span>
                    <span className="text-gray-900 font-semibold">
                      {formatCurrency(selectedEntry.amount)}
                    </span>
                  </div>
                  {selectedEntry.description && (
                    <div>
                      <span className="font-medium text-gray-700">Description:</span>
                      <p className="text-gray-900 mt-1">{selectedEntry.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Show edit history if available */}
              {selectedEntry.editHistory && selectedEntry.editHistory.length > 0 && (
                renderChangeComparison(selectedEntry)
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => generateEntryPDF(selectedEntry)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger PDF
                </button>
                <button
                  onClick={() => printEntryReceipt(selectedEntry)}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Imprimer Reçu
                </button>
                <button
                  onClick={() => openEditModal(selectedEntry)}
                  disabled={selectedEntry.status === "deleted"}
                  className={`px-4 py-2 border rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    selectedEntry.status === "deleted"
                      ? "border-gray-300 text-gray-400 cursor-not-allowed"
                      : "border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                  }`}
                >
                  <Edit className="w-4 h-4" />
                  Modifier l'Entrée
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {/* Edited Entry Details Modal */}
      {showEditedDetailsModal && selectedEditedEntry && (
        <Dialog label="Détails des modifications" onClose={() => setShowEditedDetailsModal(false)}>
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Détails des modifications - {selectedEditedEntry.entryId}
              </h3>
              <button type="button" aria-label="Fermer"
                onClick={() => setShowEditedDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Current Entry Info */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3 bg-blue-50 p-3 rounded-lg">
                  État actuel de l'entrée
                </h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expéditeur
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedEditedEntry.receivedFrom.name} ({selectedEditedEntry.receivedFrom.phone})
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Montant actuel
                    </label>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(selectedEditedEntry.amount)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Source
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedEditedEntry.source}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Catégorie
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedEditedEntry.category}
                    </p>
                  </div>
                </div>
              </div>

              {/* Edit History */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  Historique des modifications
                </h4>
                <div className="space-y-4">
                  {selectedEditedEntry.editHistory && selectedEditedEntry.editHistory.length > 0 ? (
                    selectedEditedEntry.editHistory.map((edit, index) => (
                      <div key={edit._id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h5 className="font-medium text-gray-900">
                              Modification #{selectedEditedEntry.editHistory!.length - index}
                            </h5>
                            <p className="text-sm text-gray-600">
                              {formatDate(edit.editedAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              Par: {edit.editedBy}
                            </p>
                            <p className="text-sm text-gray-600">
                              Raison: {edit.reason}
                            </p>
                          </div>
                        </div>

                        {edit.changes && Object.keys(edit.changes).length > 0 && (
                          <div className="space-y-3">
                            <h6 className="font-medium text-gray-700 text-sm">Changements détaillés:</h6>
                            {Object.entries(edit.changes).map(([field, changeData]: [string, any]) => (
                              <div key={field} className="border-l-4 border-blue-500 pl-3">
                                <div className="font-medium text-gray-700 text-sm capitalize mb-2">
                                  {field.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                  <div className="bg-red-50 p-3 rounded border border-red-200">
                                    <div className="text-red-700 font-medium mb-1">Avant:</div>
                                    <div className="text-red-600 break-words">
                                      {typeof changeData.from === 'object' 
                                        ? JSON.stringify(changeData.from, null, 2)
                                        : String(changeData.from || 'N/A')
                                      }
                                    </div>
                                  </div>
                                  <div className="bg-green-50 p-3 rounded border border-green-200">
                                    <div className="text-green-700 font-medium mb-1">Après:</div>
                                    <div className="text-green-600 break-words">
                                      {typeof changeData.to === 'object' 
                                        ? JSON.stringify(changeData.to, null, 2)
                                        : String(changeData.to || 'N/A')
                                      }
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun détail de modification disponible</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowEditedDetailsModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {/* Edit Entry Modal */}
      {showEditModal && editingEntry && (
        <Dialog label="Modifier l'Entrée" onClose={closeEditModal}>
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Modifier l'Entrée - {editingEntry.entryId}
              </h3>
              <button type="button" aria-label="Fermer"
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              {/* Entry Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  Informations de l'Entrée
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="entryhistory-field-71324" className="block text-sm font-medium text-gray-700 mb-1">
                      Montant (USD) *
                    </label>
                    <input id="entryhistory-field-71324"
                      type="number"
                      step="0.01"
                      value={editForm.amount}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          amount: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="entryhistory-field-72035" className="block text-sm font-medium text-gray-700 mb-1">
                      Source *
                    </label>
                    <select id="entryhistory-field-72035"
                      value={editForm.source}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          source: e.target.value,
                        }))
                      }
                      className="w-full p-2 border rounded"
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
                    <label htmlFor="entryhistory-field-72973" className="block text-sm font-medium text-gray-700 mb-1">
                      Catégorie *
                    </label>
                    <select id="entryhistory-field-72973"
                      value={editForm.category}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className="w-full p-2 border rounded"
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
                    <label htmlFor="entryhistory-field-73939" className="block text-sm font-medium text-gray-700 mb-1">
                      Méthode de Paiement *
                    </label>
                    <select id="entryhistory-field-73939"
                      value={editForm.paymentMethod}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          paymentMethod: e.target.value as "cash" | "card" | "transfer" | "other",
                        }))
                      }
                      className="w-full p-2 border rounded"
                      required
                    >
                      <option value="cash">Espèces</option>
                      <option value="card">Carte</option>
                      <option value="transfer">Transfert</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="entryhistory-field-74961" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea id="entryhistory-field-74961"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Description de l'entrée d'argent..."
                  className="w-full p-2 border rounded h-20"
                />
              </div>

              {/* Received From Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  Information sur l'Expéditeur
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="entryhistory-field-75884" className="block text-sm font-medium text-gray-700 mb-1">
                      Nom *
                    </label>
                    <input id="entryhistory-field-75884"
                      type="text"
                      value={editForm.receivedFrom.name}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          receivedFrom: { ...prev.receivedFrom, name: e.target.value },
                        }))
                      }
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="entryhistory-field-76593" className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone *
                    </label>
                    <input id="entryhistory-field-76593"
                      type="tel"
                      value={editForm.receivedFrom.phone}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          receivedFrom: { ...prev.receivedFrom, phone: e.target.value },
                        }))
                      }
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="entryhistory-field-77323" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input id="entryhistory-field-77323"
                      type="email"
                      value={editForm.receivedFrom.email}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          receivedFrom: { ...prev.receivedFrom, email: e.target.value },
                        }))
                      }
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Edit Reason */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  Raison de modification
                </h4>
                <textarea aria-label="Veuillez indiquer une raison pour la modification de cette entrée..."
                  value={editForm.reason}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  placeholder="Veuillez indiquer une raison pour la modification de cette entrée..."
                  className="w-full p-2 border rounded h-20"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleEditEntry}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Mise à jour...
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4" /> Mettre à jour l'Entrée
                    </>
                  )}
                </button>
                <button
                  onClick={closeEditModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
