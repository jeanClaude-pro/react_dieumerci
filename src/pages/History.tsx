// src/pages/History.tsx
import { useEffect, useState } from "react";
import jsPDF from "jspdf";

interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  date: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  paymentMethod: string;
  salesPerson: string; // Added salesPerson field
  items?: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
}

interface Product {
  _id: string;
  name: string;
  stock: number;
  price?: number;
}

const SALES_KEY = "ets_sales_v1";
const PRODUCTS_KEY = "ets_products_v1";

export default function History() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  useEffect(() => {
    const salesRaw = localStorage.getItem(SALES_KEY);
    if (salesRaw) {
      setSales(JSON.parse(salesRaw));
    }

    const productsRaw = localStorage.getItem(PRODUCTS_KEY);
    if (productsRaw) {
      setProducts(JSON.parse(productsRaw));
    }

    // Check if user is admin (you can modify this based on your auth system)
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setIsAdmin(user.role === "admin" || user.isAdmin);
    }
  }, []);

  const downloadReceipt = (sale: Sale) => {
    const doc = new jsPDF();
    const date = new Date(sale.date).toLocaleString();
    
    // Shop information
    doc.setFontSize(20);
    doc.text("Your Shop Name", 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text("123 Shop Street, City, Country", 105, 22, { align: 'center' });
    
    // Divider line
    doc.line(10, 30, 200, 30);
    
    // Receipt title
    doc.setFontSize(16);
    doc.text("SALES RECEIPT", 105, 40, { align: 'center' });
    
    // Date and receipt details
    doc.setFontSize(12);
    doc.text(`Date: ${date}`, 20, 50);
    doc.text(`Receipt #: ${sale.id.substring(0, 8)}`, 20, 57);
    
    // Customer information
    doc.text("Customer Details:", 20, 70);
    doc.text(`Name: ${sale.customerName}`, 20, 77);
    doc.text(`Phone: ${sale.customerPhone}`, 20, 84);
    if (sale.customerEmail) {
      doc.text(`Email: ${sale.customerEmail}`, 20, 91);
    }
    
    // Items header
    doc.setFillColor(200, 200, 200);
    doc.rect(20, 105, 170, 10, 'F');
    doc.setTextColor(0, 0, 0);
    doc.text("Item", 25, 112);
    doc.text("Qty", 100, 112);
    doc.text("Price", 130, 112);
    doc.text("Total", 160, 112);
    
    // Item details
    const items = sale.items || [{
      productId: sale.productId,
      name: sale.productName,
      quantity: sale.quantity,
      price: sale.unitPrice,
      total: sale.total
    }];
    
    let yPosition = 122;
    items.forEach((item: any) => {
      doc.text(item.name, 25, yPosition);
      doc.text(item.quantity.toString(), 100, yPosition);
      doc.text(`$${item.price.toFixed(2)}`, 130, yPosition);
      doc.text(`$${item.total.toFixed(2)}`, 160, yPosition);
      yPosition += 7;
    });
    
    // Total
    doc.setFontSize(14);
    doc.text(`Total: $${sale.total.toFixed(2)}`, 20, yPosition + 10);
    doc.text(`Payment Method: ${sale.paymentMethod?.toUpperCase() || 'CASH'}`, 20, yPosition + 20);
    
    // Sales person
    doc.setFontSize(12);
    doc.text(`Sales Person: ${sale.salesPerson || "Unknown"}`, 20, yPosition + 30);
    
    // Thank you message
    doc.setFontSize(12);
    doc.text("Thank you for your purchase!", 105, yPosition + 50, { align: 'center' });
    doc.text("We appreciate your business.", 105, yPosition + 57, { align: 'center' });
    
    // Save the PDF
    doc.save(`receipt-${sale.id.substring(0, 8)}.pdf`);
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
  };

  const handleSaveEdit = () => {
    if (!editingSale) return;

    // Update the sale in localStorage
    const updatedSales = sales.map(s => 
      s.id === editingSale.id ? editingSale : s
    );
    localStorage.setItem(SALES_KEY, JSON.stringify(updatedSales));
    setSales(updatedSales);

    // Update inventory (add back the original quantity and subtract the new quantity)
    const product = products.find(p => p._id === editingSale.productId);
    if (product) {
      const originalSale = sales.find(s => s.id === editingSale.id);
      if (originalSale) {
        // Add back original quantity to inventory
        const updatedProducts = products.map(p => 
          p._id === product._id 
            ? { ...p, stock: p.stock + originalSale.quantity }
            : p
        );
        
        // Subtract new quantity from inventory
        const finalProducts = updatedProducts.map(p => 
          p._id === product._id 
            ? { ...p, stock: p.stock - editingSale.quantity }
            : p
        );
        
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(finalProducts));
        setProducts(finalProducts);
      }
    }

    setEditingSale(null);
  };

  const handleCancelEdit = () => {
    setEditingSale(null);
  };

  const handleInputChange = (field: keyof Sale, value: any) => {
    if (!editingSale) return;
    
    setEditingSale(prev => {
      if (!prev) return null;
      return { ...prev, [field]: value };
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Sales History</h2>

      {sales.length === 0 ? (
        <p className="text-gray-500">No sales recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow rounded-lg">
            <thead>
              <tr className="bg-gray-100 text-left text-sm font-medium text-gray-700">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Unit Price</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Sales Person</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr
                  key={sale.id}
                  className="border-t hover:bg-gray-50 text-sm"
                >
                  <td className="py-2 px-4">
                    {new Date(sale.date).toLocaleString()}
                  </td>
                  <td className="py-2 px-4">{sale.productName}</td>
                  <td className="py-2 px-4">{sale.quantity}</td>
                  <td className="py-2 px-4">${sale.unitPrice.toFixed(2)}</td>
                  <td className="py-2 px-4 font-semibold">
                    ${sale.total.toFixed(2)}
                  </td>
                  <td className="py-2 px-4">{sale.customerName}</td>
                  <td className="py-2 px-4">
                    {sale.salesPerson || "Unknown"}
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => downloadReceipt(sale)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Download Receipt
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleEditSale(sale)}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Edit Sale</h3>
            
            <div className="mb-4">
              <label className="block mb-1 font-medium">Product Name</label>
              <input
                type="text"
                value={editingSale.productName}
                onChange={(e) => handleInputChange('productName', e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-medium">Quantity</label>
              <input
                type="number"
                value={editingSale.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                className="w-full p-2 border rounded"
                min="1"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-medium">Unit Price</label>
              <input
                type="number"
                step="0.01"
                value={editingSale.unitPrice}
                onChange={(e) => handleInputChange('unitPrice', parseFloat(e.target.value) || 0)}
                className="w-full p-2 border rounded"
                min="0.01"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-medium">Total</label>
              <input
                type="number"
                step="0.01"
                value={editingSale.unitPrice * editingSale.quantity}
                className="w-full p-2 border rounded bg-gray-100"
                disabled
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-medium">Customer Name</label>
              <input
                type="text"
                value={editingSale.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-medium">Customer Phone</label>
              <input
                type="tel"
                value={editingSale.customerPhone}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-medium">Sales Person</label>
              <input
                type="text"
                value={editingSale.salesPerson || ""}
                onChange={(e) => handleInputChange('salesPerson', e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}