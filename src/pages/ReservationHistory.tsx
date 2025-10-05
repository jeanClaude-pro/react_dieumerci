/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Search, Eye, CheckCircle, XCircle, Calendar, User, Package, Phone, Mail } from "lucide-react";

interface ReservationItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  _id: string;
}

interface Reservation {
  _id: string;
  saleId: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  items: ReservationItem[];
  subtotal: number;
  total: number;
  paymentMethod: string;
  status: string;
  type: string;
  reservationDate: string;
  reservationTime: string;
  createdAt: string;
  updatedAt: string;
  salesPerson?: string;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

const API_BASE = import.meta.env.VITE_API_URL;

export default function ReservationManagement() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [reservationToComplete, setReservationToComplete] = useState<Reservation | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try multiple endpoints to find reservations
      const endpoints = [
        `${API_BASE}/sales/reservations`,
        `${API_BASE}/sales/reservations/all`,
        `${API_BASE}/sales?type=reservation`,
        `${API_BASE}/sales?status=reservation`
      ];

      let reservationsData: Reservation[] = [];

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          const res = await fetch(endpoint, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          });

          if (res.ok) {
            const data = await res.json();
            console.log("API Response:", data);
            
            // Handle different response formats
            if (Array.isArray(data)) {
              reservationsData = data;
            } else if (data.sales && Array.isArray(data.sales)) {
              reservationsData = data.sales;
            } else if (data.data && Array.isArray(data.data)) {
              reservationsData = data.data;
            } else if (data.reservations && Array.isArray(data.reservations)) {
              reservationsData = data.reservations;
            } else {
              // If we get an object but no array, try to use it as a single reservation
              reservationsData = [data];
            }

            if (reservationsData.length > 0) {
              console.log(`Found ${reservationsData.length} reservations from ${endpoint}`);
              break;
            }
          }
        } catch (err) {
          console.log(`Endpoint ${endpoint} failed:`, err);
          // Continue to next endpoint
        }
      }

      // Only set reservations if we found data from API
      if (reservationsData.length > 0) {
        setReservations(reservationsData);
      } else {
        setError("Aucune réservation trouvée dans la base de données");
        setReservations([]);
      }
    } catch (error) {
      console.error("Error loading reservations:", error);
      setError("Échec du chargement des réservations");
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch = 
      reservation.saleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.customer.phone.includes(searchTerm) ||
      (reservation.customer.email && reservation.customer.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'pending' && reservation.status !== 'completed') ||
      (filterStatus === 'completed' && reservation.status === 'completed');

    return matchesSearch && matchesStatus;
  });

  const pendingReservations = reservations.filter(r => r.status !== 'completed');
  const completedReservations = reservations.filter(r => r.status === 'completed');

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Date invalide";
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Date invalide";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const viewReservationDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowModal(true);
    setError(null);
  };

  const openCompletionDialog = (reservation: Reservation) => {
    setReservationToComplete(reservation);
    setShowCompletionDialog(true);
  };

  const closeCompletionDialog = () => {
    setShowCompletionDialog(false);
    setReservationToComplete(null);
  };

  // Print receipt function for completion
  const printCompletionReceipt = (reservation: Reservation) => {
    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (printWindow) {
      const username = localStorage.getItem("username") || "VENDEUR";
      printWindow.document.write(`
<html>
  <head>
    <title>Reçu de Retrait Réservation</title>
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
      .completion-badge {
        background-color: #28a745;
        color: white;
        padding: 2mm;
        font-weight: bold;
        text-align: center;
        margin: 1mm 0;
        font-size: 14px;
        border-radius: 3px;
      }
      .items-section {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #fafafa;
        border: 1px solid #eee;
      }
      .item-row { 
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5mm;
        padding: 0 1mm;
        border-bottom: 1px dotted #ddd;
      }
      .item-name {
        text-align: left;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .item-details {
        text-align: right;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .total-section { 
        font-weight: bold; 
        margin-top: 1mm;
        padding: 1mm;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .total-row {
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
      .sales-person {
        margin-top: 1mm;
        text-align: center;
        font-weight: bold;
        font-size: 12px;
        padding: 1mm;
        background-color: #e8e8e8;
        border: 1px solid #ccc;
        border-radius: 2px;
      }
      .customer-info {
        margin: 1mm 0;
        padding: 1mm;
        font-weight: bold;
        text-align: center;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .customer-field {
        margin-bottom: 0.3mm;
        font-size: 12px;
      }
      .completion-info {
        background-color: #d4edda;
        border: 2px solid #28a745;
        padding: 1mm;
        margin: 1mm 0;
        font-weight: bold;
        font-size: 12px;
        border-radius: 3px;
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
        }
        .receipt-container { 
          border: none !important; 
          box-shadow: none !important; 
          margin: 0 auto !important;
          padding: 0.5mm !important;
          width: 70mm !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="receipt-container">
      <div class="header">
        <div class="shop-name"><strong>ETS. DIEU MERCI</strong></div>
        <div class="shop-details"><strong>Av Manono Coin Munama N°39, C. Kenya, Lubumbashi</strong></div>
        <div class="shop-details">TEL: <strong>+243 977 771 421 / +243 853 549 102</strong></div>
        <div class="shop-details"><strong>RCCM: 14-A-017885</strong></div>
      </div>
      
      <div class="completion-badge">
        <strong>✅ RETRAIT EFFECTUÉ ✅</strong>
      </div>
      
      <div class="receipt-info">
        <div class="shop-details">DATE RETRAIT: <strong>${new Date().toLocaleString('fr-FR')}</strong></div>
        <div class="shop-details">RESERVATION #: <strong>${reservation.saleId}</strong></div>
      </div>
      
      <div class="customer-info">
        <div class="customer-field">CLIENT: <strong>${reservation.customer.name.toUpperCase()}</strong></div>
        <div class="customer-field">TELEPHONE: <strong>${reservation.customer.phone}</strong></div>
      </div>
      
      <div class="receipt-title">ARTICLES RETIRÉS</div>
      
      <div class="items-section">
      ${reservation.items
        .map(
          (item) => `
        <div class="item-row">
          <div class="item-name"><strong>${item.name}</strong></div>
          <div class="item-details">
            <strong>${item.quantity}Pcs</strong>
          </div>
        </div>
      `
        )
        .join("")}
      </div>
      
      <div class="completion-info">
        <div><strong>RÉSERVATION COMPLÉTÉE</strong></div>
        <div><strong>Articles remis au client</strong></div>
      </div>
      
      <div class="sales-person">
        Agent: <strong>${username}</strong>
      </div>
      
      <div class="footer">
        <div class="thank-you"><strong>RETRAIT EFFECTUÉ AVEC SUCCÈS !</strong></div>
        <div class="warning"><strong>Merci de votre confiance</strong></div>
        <div class="thank-you"><strong>A BIENTOT !</strong></div>
      </div>

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

  const markAsCompleted = async (reservation: Reservation) => {
    try {
      setLoading(true);
      // Try multiple endpoints for completion
      const endpoints = [
        `${API_BASE}/sales/${reservation._id}/complete`,
        `${API_BASE}/reservations/${reservation._id}/complete`,
        `${API_BASE}/sales/${reservation._id}`,
        `${API_BASE}/reservations/${reservation._id}`
      ];

      let success = false;

      for (const endpoint of endpoints) {
        try {
          const method = endpoint.includes('complete') ? 'PATCH' : 'PUT';
          const body = endpoint.includes('complete') 
            ? JSON.stringify({
                completedBy: localStorage.getItem("username") || "Admin",
                status: "completed"
              })
            : JSON.stringify({
                ...reservation,
                status: "completed",
                completedBy: localStorage.getItem("username") || "Admin",
                completedAt: new Date().toISOString()
              });

          const response = await fetch(endpoint, {
            method,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
            body,
          });

          if (response.ok) {
            success = true;
            break;
          }
        } catch (err) {
          // Continue to next endpoint
        }
      }

      if (success) {
        setMessage("✅ Réservation marquée comme complétée avec succès");
        // Update local state immediately
        setReservations(prev => prev.map(r => 
          r._id === reservation._id 
            ? { 
                ...r, 
                status: "completed",
                completedBy: localStorage.getItem("username") || "Admin",
                completedAt: new Date().toISOString()
              }
            : r
        ));
        setShowCompletionDialog(false);
        
        // Print completion receipt
        setTimeout(() => {
          printCompletionReceipt(reservation);
        }, 500);
      } else {
        setError("Échec de la mise à jour de la réservation");
        console.error("All API endpoints failed for completion");
      }
    } catch (error) {
      setError("Erreur de connexion lors de la mise à jour");
      console.error("Error completing reservation:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsPending = async (reservation: Reservation) => {
    // Improved confirmation dialog
    const confirmMessage = `Êtes-vous sûr de vouloir remettre la réservation ${reservation.saleId} en attente ?\n\nCette action ne pourra pas être annulée.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);
      // Try multiple endpoints for pending status
      const endpoints = [
        `${API_BASE}/sales/${reservation._id}/pending`,
        `${API_BASE}/reservations/${reservation._id}/pending`,
        `${API_BASE}/sales/${reservation._id}`,
        `${API_BASE}/reservations/${reservation._id}`
      ];

      let success = false;

      for (const endpoint of endpoints) {
        try {
          const method = endpoint.includes('pending') ? 'PATCH' : 'PUT';
          const body = endpoint.includes('pending') 
            ? JSON.stringify({ status: "pending" })
            : JSON.stringify({
                ...reservation,
                status: "pending",
                completedBy: undefined,
                completedAt: undefined
              });

          const response = await fetch(endpoint, {
            method,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
            body,
          });

          if (response.ok) {
            success = true;
            break;
          }
        } catch (err) {
          // Continue to next endpoint
        }
      }

      if (success) {
        setMessage("✅ Réservation remise en attente avec succès");
        // Update local state immediately
        setReservations(prev => prev.map(r => 
          r._id === reservation._id 
            ? { 
                ...r, 
                status: "pending",
                completedBy: undefined,
                completedAt: undefined
              }
            : r
        ));
        setShowModal(false);
      } else {
        setError("Échec de la mise à jour de la réservation");
        console.error("All API endpoints failed for pending status");
      }
    } catch (error) {
      setError("Erreur de connexion lors de la mise à jour");
      console.error("Error setting reservation to pending:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 flex-1 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestion des Réservations
          </h1>
          <p className="text-gray-600">
            Gérez et suivez l'état des réservations des clients
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">
              En attente: <span className="font-bold">{pendingReservations.length}</span>
            </div>
          </div>
          <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-200">
            <div className="text-sm text-green-600 font-medium">
              Complétées: <span className="font-bold">{completedReservations.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-blue-600">{reservations.length}</div>
          <div className="text-sm text-gray-600">Total Réservations</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-orange-600">{pendingReservations.length}</div>
          <div className="text-sm text-gray-600">En Attente</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-green-600">{completedReservations.length}</div>
          <div className="text-sm text-gray-600">Complétées</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-purple-600">
            {reservations.reduce((sum, r) => sum + r.items.length, 0)}
          </div>
          <div className="text-sm text-gray-600">Articles Réservés</div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg border border-green-200">
          {message}
          <button
            onClick={() => setMessage(null)}
            className="float-right text-green-700 hover:text-green-900"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg border border-red-200">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher par ID, client, téléphone..."
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Toutes les réservations</option>
            <option value="pending">En attente seulement</option>
            <option value="completed">Complétées seulement</option>
          </select>

          <button
            onClick={fetchReservations}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            {loading ? "Chargement..." : "Actualiser"}
          </button>
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Liste des Réservations ({filteredReservations.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Chargement des réservations...</p>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune réservation trouvée</p>
              <p className="text-sm">Les réservations apparaîtront ici après création</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Réservation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Réservation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Articles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReservations.map((reservation) => (
                  <tr key={reservation._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {reservation.saleId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {reservation.customer.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {reservation.customer.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{formatDate(reservation.reservationDate || reservation.createdAt)}</div>
                      <div className="text-gray-500 text-xs">
                        {reservation.reservationTime || "Heure non spécifiée"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reservation.items.length} article(s)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(reservation.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          reservation.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {reservation.status === 'completed' ? 'Complétée' : 'En Attente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewReservationDetails(reservation)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {reservation.status !== 'completed' ? (
                          <button
                            onClick={() => openCompletionDialog(reservation)}
                            disabled={loading}
                            className="text-green-600 hover:text-green-900 p-1 rounded disabled:opacity-50"
                            title="Marquer comme complétée"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => markAsPending(reservation)}
                            disabled={loading}
                            className="text-orange-600 hover:text-orange-900 p-1 rounded disabled:opacity-50"
                            title="Remettre en attente"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Completion Confirmation Dialog */}
      {showCompletionDialog && reservationToComplete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Confirmer la complétion
              </h3>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Êtes-vous sûr de vouloir marquer la réservation <strong>{reservationToComplete.saleId}</strong> comme complétée ?
                Un reçu de retrait sera imprimé.
              </p>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={closeCompletionDialog}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => markAsCompleted(reservationToComplete)}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  {loading ? "Traitement..." : "Confirmer et Imprimer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reservation Details Modal */}
      {showModal && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Détails de la Réservation - {selectedReservation.saleId}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Reservation Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Réservation
                  </label>
                  <p className="text-sm text-gray-900">{selectedReservation.saleId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de Création
                  </label>
                  <p className="text-sm text-gray-900">
                    {formatDateTime(selectedReservation.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de Réservation
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedReservation.reservationDate 
                      ? `${formatDate(selectedReservation.reservationDate)} à ${selectedReservation.reservationTime}`
                      : 'Non spécifiée'
                    }
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Méthode de Paiement
                  </label>
                  <p className="text-sm text-gray-900 capitalize">
                    {selectedReservation.paymentMethod}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedReservation.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {selectedReservation.status === 'completed' ? 'Complétée' : 'En Attente'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendeur
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedReservation.salesPerson || "Non spécifié"}
                  </p>
                </div>
                {selectedReservation.completedAt && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Complétée le
                      </label>
                      <p className="text-sm text-gray-900">
                        {formatDateTime(selectedReservation.completedAt)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Complétée par
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedReservation.completedBy || "Inconnu"}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Customer Info */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Informations du Client
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Nom</p>
                        <p className="text-sm text-gray-900">{selectedReservation.customer.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Téléphone</p>
                        <p className="text-sm text-gray-900">{selectedReservation.customer.phone}</p>
                      </div>
                    </div>
                    {selectedReservation.customer.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Email</p>
                          <p className="text-sm text-gray-900">{selectedReservation.customer.email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Articles Réservés ({selectedReservation.items.length})
                </h4>
                <div className="space-y-3">
                  {selectedReservation.items.map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium text-gray-900">{item.name}</h5>
                          <p className="text-sm text-gray-600">
                            Quantité: {item.quantity} × {formatCurrency(item.price)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {formatCurrency(item.total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedReservation.notes && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    Notes
                  </h4>
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <p className="text-sm text-gray-700">{selectedReservation.notes}</p>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span className="text-gray-900">Montant Total:</span>
                  <span className="text-gray-900">
                    {formatCurrency(selectedReservation.total)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                {selectedReservation.status !== 'completed' ? (
                  <button
                    onClick={() => openCompletionDialog(selectedReservation)}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Marquer comme Complétée
                  </button>
                ) : (
                  <button
                    onClick={() => markAsPending(selectedReservation)}
                    className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Remettre en Attente
                  </button>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}