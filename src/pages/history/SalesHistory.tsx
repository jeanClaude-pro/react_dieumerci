"use client";

import { useState, useEffect } from "react";
import {
  Search,
  FileText,
  Eye,
  Download,
  User,
  Package,
  Edit,
  Trash2,
  Plus,
  Minus,
  RefreshCw,
  Printer,
} from "lucide-react";
import jsPDF from "jspdf";

interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  _id: string;
}

interface Sale {
  _id: string;
  saleId: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  items: SaleItem[];
  subtotal: number;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  salesPerson?: string;
  editedBy?: string;
  editedAt?: string;
}

interface Product {
  _id: string;
  name: string;
  stock: number;
  price: number;
  sku?: string;
}

export default function SalesHistory() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editForm, setEditForm] = useState({
    customer: { name: "", phone: "", email: "" },
    items: [] as SaleItem[],
    paymentMethod: "cash",
    reason: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    fetchSales();
    fetchProducts();
    const handleSalesUpdate = () => {
      // You can add logic here if needed to refresh customer data
    };

    window.addEventListener("salesUpdated", handleSalesUpdate);

    return () => {
      window.removeEventListener("salesUpdated", handleSalesUpdate);
    };
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      // Remove pagination - fetch ALL sales at once
      const res = await fetch(`${import.meta.env.VITE_API_URL}/sales?limit=0`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        
        // Handle different response formats
        let allSales: Sale[] = [];
        if (Array.isArray(data)) {
          allSales = data;
        } else if (data.sales && Array.isArray(data.sales)) {
          allSales = data.sales;
        } else if (data.data && Array.isArray(data.data)) {
          allSales = data.data;
        } else {
          console.warn("Unexpected sales data structure:", data);
          allSales = [];
        }

        console.log(`Fetched ${allSales.length} sales from API`);
        
        // Sort sales by date - newest first
        const sortedSales = allSales.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setSales(sortedSales);
      } else {
        console.error("Sales fetch failed:", res.status);
        // Try alternative endpoints
        await tryAlternativeFetch();
      }
    } catch (error) {
      console.error("Error loading sales:", error);
      setError("Failed to load sales");
      // Try alternative endpoints
      await tryAlternativeFetch();
    } finally {
      setLoading(false);
    }
  };

  // Alternative fetch method if the main one fails
  const tryAlternativeFetch = async () => {
    try {
      console.log("SalesHistory: Trying alternative fetch method...");
      
      const endpoints = [
        `${import.meta.env.VITE_API_URL}/sales?limit=1000`,
        `${import.meta.env.VITE_API_URL}/sales/all`,
      ];
      
      let allSales: Sale[] = [];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
              allSales = data;
              break;
            } else if (data.sales && Array.isArray(data.sales)) {
              allSales = data.sales;
              break;
            } else if (data.data && Array.isArray(data.data)) {
              allSales = data.data;
              break;
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch from ${endpoint}:`, error);
          continue;
        }
      }
      
      console.log(`SalesHistory: Alternative fetch got ${allSales.length} sales`);
      
      // Sort sales by date - newest first
      const sortedSales = allSales.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setSales(sortedSales);
    } catch (error) {
      console.error("SalesHistory: Alternative fetch also failed:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/products?limit=0`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      console.log("Products API Response Status:", res.status);

      if (res.ok) {
        const data = await res.json();
        console.log("Products API Response Data:", data);

        // Handle different response structures
        let productsArray: Product[] = [];

        if (Array.isArray(data)) {
          productsArray = data;
        } else if (data && Array.isArray(data.products)) {
          productsArray = data.products;
        } else if (data && typeof data === "object") {
          // If it's a single product object, wrap it in an array
          productsArray = [data];
        }

        console.log("Processed products:", productsArray);
        setProducts(productsArray);

        if (productsArray.length === 0) {
          console.warn("No products found in response");
        }
      } else {
        console.error("Products API Error:", res.status, res.statusText);
        const errorText = await res.text();
        console.error("Error response:", errorText);
        setError(`Failed to load products: ${res.status} ${res.statusText}`);
      }
    } catch (error) {
      console.error("Error loading products:", error);
      setError("Failed to load products. Please check your connection.");
    } finally {
      setLoadingProducts(false);
    }
  };

  const filteredSales = sales.filter(
    (sale) =>
      sale.saleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer.phone.includes(searchTerm) ||
      (sale.salesPerson &&
        sale.salesPerson.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Print function for ESC/POS receipt - opens print dialog
  const printESC_POSReceipt = (sale: Sale) => {
    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (printWindow) {
      printWindow.document.write(`
<html>
  <head>
    <title>Sale Receipt - ESC/POS</title>
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
        <div class="shop-name"><strong>ETS. DIEU MERCI</strong></div>
        <div class="shop-details"><strong>Av Manono Coin Munama N°39, C. Kenya, Lubumbashi</strong></div>
        <div class="shop-details">TEL: <strong>+243 977 771 421 / +243 853 549 102</strong></div>
        <div class="shop-details"><strong>RCCM: 14-A-017885</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">DATE: <strong>${formatDate(sale.createdAt)}</strong></div>
        <div class="shop-details">RECU #: <strong>${sale.saleId}</strong></div>
      </div>
      
      <div class="customer-info">
        <div class="customer-field">CLIENT: <strong>${sale.customer.name.toUpperCase()}</strong></div>
        <div class="customer-field">TELEPHONE: <strong>${sale.customer.phone}</strong></div>
        ${
          sale.customer.email
            ? `<div class="customer-field">EMAIL: <strong>${sale.customer.email}</strong></div>`
            : ""
        }
      </div>
      
      <div class="receipt-title">ARTICLES ACHETES</div>
      
      <div class="items-section">
      ${sale.items
        .map(
          (item) => `
        <div class="item-row">
          <div class="item-name"><strong>${item.name}</strong></div>
          <div class="item-details">
            <strong>${item.quantity}PcsX$${item.price.toFixed(2)}</strong>
          </div>
        </div>
      `
        )
        .join("")}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>SOUS-TOTAL:</strong></div>
          <div><strong>$${sale.subtotal.toFixed(2)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>TOTAL:</strong></div>
          <div><strong>$${sale.total.toFixed(2)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>PAIEMENT:</strong></div>
          <div class="payment-method"><strong>${sale.paymentMethod.toUpperCase()}</strong></div>
        </div>
      </div>
      
      <div class="sales-person">
        Agent: <strong>${(sale.salesPerson || 'Non spécifié').toUpperCase()}</strong>
      </div>
      
      <div class="footer">
        <div class="thank-you"><strong>MERCI POUR VOTRE ACHAT !</strong></div>
        <div class="warning"><strong>Article non echangeable</strong></div>
        <div class="warning"><strong>Non remboursable</strong></div>
        <div class="thank-you"><strong>A BIENTOT !</strong></div>
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

  const generateReceiptPDF = (sale: Sale) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text("ETS. DIEU MERCI", 105, 10, { align: "center" });
    doc.setFontSize(10);
    doc.text("<<Chez Dan Collection>>", 105, 15, { align: "center" });
    doc.setFontSize(12);
    doc.text("RCCM: 14-A-017885", 105, 20, { align: "center" });
    doc.text("Tél: +243 977 771 421 / +243 853 549 102", 105, 25, {
      align: "center",
    });
    doc.text("Av Manono Coin Munama N°39,C.Kenya, Lubumbashi", 105, 30, {
      align: "center",
    });

    doc.setFontSize(16);
    doc.text("Reçu de vente", 105, 35, { align: "center" });

    // Sale Info
    doc.setFontSize(10);
    doc.text(`Date: ${formatDate(sale.createdAt)}`, 20, 45);
    doc.text(`Reçu #: ${sale.saleId}`, 20, 52);
    doc.text(`Payement: ${sale.paymentMethod.toUpperCase()}`, 20, 59);
    doc.text(`Statut: ${sale.status.toUpperCase()}`, 20, 66);

    // Sales Person Info
    doc.text(`Agent: ${sale.salesPerson || "Non spécifié"}`, 20, 73);

    // Customer Info
    doc.setFontSize(12);
    doc.text("Information sur le client:", 20, 85);
    doc.setFontSize(10);
    doc.text(`Nom: ${sale.customer.name}`, 20, 92);
    doc.text(`Phone: ${sale.customer.phone}`, 20, 99);
    if (sale.customer.email) {
      doc.text(`Email: ${sale.customer.email}`, 20, 106);
    }

    // Items
    doc.setFontSize(12);
    doc.text("Articles:", 20, 113);
    doc.setFontSize(10);
    let yPos = 120;

    sale.items.forEach((item, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.text(`${index + 1}. ${item.name}`, 20, yPos);
      doc.text(
        `Qty: ${item.quantity} x ${formatCurrency(
          item.price
        )} = ${formatCurrency(item.total)}`,
        25,
        yPos + 6
      );
      yPos += 15;
    });

    // Totals
    yPos += 7;
    doc.text(`Sous-total: ${formatCurrency(sale.subtotal)}`, 20, yPos);
    doc.text(`Total: ${formatCurrency(sale.total)}`, 20, yPos + 5);

    // Footer
    doc.setFontSize(10);
    doc.text("Merci pour votre achat !", 105, yPos + 20, {
      align: "center",
    });
    doc.text(
      "Les marchandises vendues ne sont ni reprises ni échangées.",
      105,
      yPos + 30,
      {
        align: "center",
      }
    );
    doc.text("À bientôt", 105, yPos + 40, {
      align: "center",
    });

    doc.save(`receipt-${sale.saleId}.pdf`);
  };

  const viewSaleDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setShowModal(true);
    setError(null);
  };

  const openEditModal = async (sale: Sale) => {
    if (sale.status === "voided" || sale.status === "corrected") {
      setError("Cannot edit a voided or corrected sale");
      return;
    }

    setEditingSale(sale);
    setEditForm({
      customer: { ...sale.customer },
      items: sale.items.map((item) => ({ ...item })),
      paymentMethod: sale.paymentMethod,
      reason: "",
    });
    setShowEditModal(true);
    setError(null);

    // Ensure products are loaded
    if (products.length === 0) {
      await fetchProducts();
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingSale(null);
    setEditForm({
      customer: { name: "", phone: "", email: "" },
      items: [],
      paymentMethod: "cash",
      reason: "",
    });
    setError(null);
  };

  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    const updatedItems = [...editForm.items];
    const product = products.find(
      (p) => p._id === updatedItems[index].productId
    );

    if (product && newQuantity > product.stock + updatedItems[index].quantity) {
      setError(`Insufficient stock. Available: ${product.stock}`);
      return;
    }

    updatedItems[index].quantity = newQuantity;
    updatedItems[index].total = newQuantity * updatedItems[index].price;

    setEditForm((prev) => ({
      ...prev,
      items: updatedItems,
    }));
    setError(null);
  };

  const updateItemPrice = (index: number, newPrice: number) => {
    if (newPrice < 0) return;

    const updatedItems = [...editForm.items];
    updatedItems[index].price = newPrice;
    updatedItems[index].total = newPrice * updatedItems[index].quantity;

    setEditForm((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const removeItem = (index: number) => {
    const updatedItems = editForm.items.filter((_, i) => i !== index);
    setEditForm((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const addNewItem = () => {
    if (products.length === 0) {
      setError("No products available. Please refresh products first.");
      return;
    }

    const defaultProduct = products[0];
    const newItem: SaleItem = {
      productId: defaultProduct._id,
      name: defaultProduct.name,
      quantity: 1,
      price: defaultProduct.price,
      total: defaultProduct.price,
      _id: `temp-${Date.now()}`,
    };

    setEditForm((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const updateItemProduct = (index: number, productId: string) => {
    const product = products.find((p) => p._id === productId);
    if (!product) {
      setError("Selected product not found");
      return;
    }

    const updatedItems = [...editForm.items];
    updatedItems[index].productId = productId;
    updatedItems[index].name = product.name;
    updatedItems[index].price = product.price;
    updatedItems[index].total = product.price * updatedItems[index].quantity;

    setEditForm((prev) => ({
      ...prev,
      items: updatedItems,
    }));
    setError(null);
  };

  const calculateTotals = () => {
    const subtotal = editForm.items.reduce((sum, item) => sum + item.total, 0);
    return { subtotal, total: subtotal };
  };

  const handleEditSale = async () => {
    if (!editingSale) return;

    if (editForm.items.length === 0) {
      setError("Sale must contain at least one item");
      return;
    }

    if (!editForm.customer.name || !editForm.customer.phone) {
      setError("Customer name and phone are required");
      return;
    }

    if (!editForm.reason) {
      setError("Please provide a reason for editing this sale");
      return;
    }

    try {
      setLoading(true);

      // Calculate totals properly
      const { subtotal, total } = calculateTotals();

      // Make sure we're sending the correct data structure
      const updateData = {
        customer: editForm.customer,
        items: editForm.items.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        subtotal: subtotal,
        total: total,
        paymentMethod: editForm.paymentMethod,
        reason: editForm.reason,
        // Include the original sale ID to ensure update, not create
        _id: editingSale._id,
        saleId: editingSale.saleId, // Keep the same sale ID
      };

      console.log("Sending update data:", updateData); // Debug log

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/sales/${editingSale._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      console.log("Update response status:", response.status); // Debug log

      if (response.ok) {
        const updatedSale = await response.json();
        console.log("Updated sale:", updatedSale); // Debug log

        setMessage("✅ Sale updated successfully");

        // Refresh the sales list immediately
        await fetchSales();

        // Also refresh customers to update their statistics
        setTimeout(() => {
          // This will trigger a refresh in the Customers component if it's mounted
          window.dispatchEvent(new Event("salesUpdated"));
        }, 1000);

        closeEditModal();
      } else {
        const errorData = await response.json();
        console.error("Update error:", errorData); // Debug log
        setError(
          errorData.error ||
            `Failed to update sale: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error updating sale:", error);
      setError("Failed to update sale. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleVoidSale = async (sale: Sale) => {
    if (sale.status === "voided") {
      setError("Sale is already voided");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to void sale ${sale.saleId}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/sales/${sale._id}/void`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: JSON.stringify({
            reason: "Sale voided by admin",
          }),
        }
      );

      if (response.ok) {
        setMessage("✅ Sale voided successfully");
        await fetchSales();
        setShowModal(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to void sale");
      }
    } catch (error) {
      setError("Failed to void sale");
      console.error("Error voiding sale:", error);
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, total } = calculateTotals();

  return (
    <div className="space-y-6 p-6 flex-1 overflow-auto">
      <div className="flex items-center justify-between flex-wrap gap-4 overflow-auto">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Historique des ventes
          </h1>
          <p className="text-gray-600">
            Voir toutes les transactions et ventes passées
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search sales..."
              className="pl-10 w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

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

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Sales Transactions ({sales.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading sales...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No sales found</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Identifiant de vente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Articles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sale.saleId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {sale.customer.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {sale.customer.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.salesPerson || "Non spécifié"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.items.length} Article(s)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          sale.status === "Complétée"
                            ? "bg-green-100 text-green-800"
                            : sale.status === "Annulé"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(sale.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewSaleDetails(sale)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Voir les détails de"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(sale)}
                          disabled={
                            sale.status === "Annulé" ||
                            sale.status === "Rectifié"
                          }
                          className={`p-1 rounded ${
                            sale.status === "Annulé" ||
                            sale.status === "Rectifié"
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-yellow-600 hover:text-yellow-900"
                          }`}
                          title="Edit Sale"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => generateReceiptPDF(sale)}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="Download PDF Receipt"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => printESC_POSReceipt(sale)}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded"
                          title="Print ESC/POS Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleVoidSale(sale)}
                          disabled={sale.status === "voided"}
                          className={`p-1 rounded ${
                            sale.status === "voided"
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-red-600 hover:text-red-900"
                          }`}
                          title="Void Sale"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* REMOVED PAGINATION SECTION - No more page navigation */}
      </div>

      {/* Sale Details Modal */}
      {showModal && selectedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Sale Details
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Sale Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Identifiant de vente
                  </label>
                  <p className="text-sm text-gray-900">{selectedSale.saleId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <p className="text-sm text-gray-900">
                    {formatDate(selectedSale.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Methode de Payment{" "}
                  </label>
                  <p className="text-sm text-gray-900 capitalize">
                    {selectedSale.paymentMethod}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      selectedSale.status === "Complétée"
                        ? "bg-green-100 text-green-800"
                        : selectedSale.status === "voided"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {selectedSale.status}
                  </span>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agent
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedSale.salesPerson || "Non spécifié"}
                  </p>
                </div>
                {selectedSale.editedBy && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dernière modification
                    </label>
                    <p className="text-sm text-gray-900">
                      By: {selectedSale.editedBy} at{" "}
                      {selectedSale.editedAt
                        ? formatDate(selectedSale.editedAt)
                        : "N/A"}
                    </p>
                  </div>
                )}
              </div>

              {/* Customer Info */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Information sur le client
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedSale.customer.name}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedSale.customer.phone}
                      </p>
                    </div>
                    {selectedSale.customer.email && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <p className="text-sm text-gray-900">
                          {selectedSale.customer.email}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Articles ({selectedSale.items.length})
                </h4>
                <div className="space-y-3">
                  {selectedSale.items.map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium text-gray-900">
                            {item.name}
                          </h5>
                          <p className="text-sm text-gray-600">
                            Nombre de pieces: {item.quantity} ×{" "}
                            {formatCurrency(item.price)}
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

              {/* Totals */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Sous-total:</span>
                  <span className="text-sm text-gray-900">
                    {formatCurrency(selectedSale.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">
                    {formatCurrency(selectedSale.total)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => generateReceiptPDF(selectedSale)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger PDF
                </button>
                <button
                  onClick={() => printESC_POSReceipt(selectedSale)}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Imprimer Reçu
                </button>
                <button
                  onClick={() => openEditModal(selectedSale)}
                  disabled={
                    selectedSale.status === "voided" ||
                    selectedSale.status === "corrected"
                  }
                  className={`px-4 py-2 border rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    selectedSale.status === "voided" ||
                    selectedSale.status === "corrected"
                      ? "border-gray-300 text-gray-400 cursor-not-allowed"
                      : "border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                  }`}
                >
                  <Edit className="w-4 h-4" />
                  Modifier la vente
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sale Modal */}
      {showEditModal && editingSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Sale - {editingSale.saleId}
              </h3>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              {/* Customer Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  Information sur le client
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={editForm.customer.name}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          customer: { ...prev.customer, name: e.target.value },
                        }))
                      }
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Numéro de téléphone
                    </label>
                    <input
                      type="tel"
                      value={editForm.customer.phone}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          customer: { ...prev.customer, phone: e.target.value },
                        }))
                      }
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editForm.customer.email}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          customer: { ...prev.customer, email: e.target.value },
                        }))
                      }
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  Methode de payement
                </h4>
                <select
                  value={editForm.paymentMethod}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      paymentMethod: e.target.value,
                    }))
                  }
                  className="w-full p-2 border rounded"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="transfer">Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Items Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-md font-medium text-gray-900">
                    Articles
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={fetchProducts}
                      disabled={loadingProducts}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${
                          loadingProducts ? "animate-spin" : ""
                        }`}
                      />{" "}
                      Refresh Products
                    </button>
                    <button
                      onClick={addNewItem}
                      disabled={products.length === 0}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Ajouter un article
                    </button>
                  </div>
                </div>

                {products.length === 0 && !loadingProducts && (
                  <div className="p-3 bg-yellow-100 text-yellow-700 rounded-lg mb-4">
                    <p className="text-sm">
                      Aucun article disponible. Veuillez vérifier si des
                      articles existent dans votre base de données.
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {editForm.items.map((item, index) => (
                    <div
                      key={item._id}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Article
                          </label>
                          {loadingProducts ? (
                            <div className="p-2 border rounded bg-gray-200 text-gray-600 text-sm">
                              Loading products...
                            </div>
                          ) : products.length === 0 ? (
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => {
                                const updatedItems = [...editForm.items];
                                updatedItems[index].name = e.target.value;
                                setEditForm((prev) => ({
                                  ...prev,
                                  items: updatedItems,
                                }));
                              }}
                              placeholder="Product name"
                              className="w-full p-2 border rounded"
                            />
                          ) : (
                            <select
                              value={item.productId}
                              onChange={(e) =>
                                updateItemProduct(index, e.target.value)
                              }
                              className="w-full p-2 border rounded"
                            >
                              {products.map((product) => (
                                <option key={product._id} value={product._id}>
                                  {product.name} -{" "}
                                  {formatCurrency(product.price)} (Stock:{" "}
                                  {product.stock})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prix
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) =>
                              updateItemPrice(
                                index,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full p-2 border rounded"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre de pièces{" "}
                          </label>
                          <div className="flex items-center border rounded">
                            <button
                              type="button"
                              onClick={() =>
                                updateItemQuantity(index, item.quantity - 1)
                              }
                              className="p-2 hover:bg-gray-200"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItemQuantity(
                                  index,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-full p-2 text-center border-0"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updateItemQuantity(index, item.quantity + 1)
                              }
                              className="p-2 hover:bg-gray-200"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Total
                          </label>
                          <div className="p-2 bg-white border rounded font-medium">
                            {formatCurrency(item.total)}
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="w-full p-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Sous-total:</span>
                  <span className="text-sm text-gray-900">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Edit Reason */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  Raison de modification
                </h4>
                <textarea
                  value={editForm.reason}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  placeholder="Veuillez indiquer une raison pour la modification de cette vente...."
                  className="w-full p-2 border rounded h-20"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleEditSale}
                  disabled={loading || editForm.items.length === 0}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4" /> Mettre à jour la vente
                    </>
                  )}
                </button>
                <button
                  onClick={closeEditModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}