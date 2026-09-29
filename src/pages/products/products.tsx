"use client";
import ResponsiveTable from "../../components/ui/ResponsiveTable";
import Dialog from "../../components/ui/Dialog";
import { EmptyState, LoadingState } from "../../components/ui/States";

import type React from "react";
import { useState, useEffect } from "react";
import { Package, Plus, Search, Edit, Eye, X, ClipboardList, ArrowDownUp } from "lucide-react";
import { getProductStatus } from "../../utils/constants";
import { toast } from "react-toastify";
import type { Product } from "../../types";
import { units, serverUrl } from "../../utils/constants";
import CategoriesDropdown from "../../components/CategoriesDropdown";
import StockCardDialog from "../../components/inventory/StockCardDialog";
import StockMovementDialog from "../../components/inventory/StockMovementDialog";
import { isProductSellable } from "../../utils/productAvailability";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "staff";
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [stockCardProduct, setStockCardProduct] = useState<Product | null>(null);
  const [movementProduct, setMovementProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    description: "",
    price: 0,
    category: "",
    brand: "",
    stock: 0,
    minStock: 0,
    unit: "pcs",
    weight: 0,
    status: "active",
  });

  // Get current user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData));
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  const isAdmin = currentUser?.role === "admin";

  // API Functions
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${serverUrl}/products?includeInactive=true`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        console.error("Failed to fetch products:", await response.text());
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData: Partial<Product>) => {
    try {
      const response = await fetch(`${serverUrl}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify(productData),
      });
      if (response.ok) {
        const newProduct = await response.json();
        setProducts((prev) => [...prev, newProduct]);
        setShowAddModal(false);
        resetForm();
        toast.success("Article ajouté avec succès!");
      } else {
        toast.error("echec de l'ajout de l'Article");
      }
    } catch (error) {
      console.error("erreur d'ajout de l'Article:", error);
      toast.error("Error creating product");
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>, expectedStock?: number) => {
    try {
      const response = await fetch(`${serverUrl}/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        // expectedStock = the quantity shown when the form opened: the server
        // refuses the edit if a sale changed the stock in the meantime.
        body: JSON.stringify({ ...productData, expectedStock }),
      });
      if (response.ok) {
        const updatedProduct = await response.json();
        setProducts((prev) =>
          prev.map((p) => (p._id === id ? updatedProduct : p))
        );
        setShowEditModal(false);
        resetForm();
        toast.success("Product updated successfully!");
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data?.error || "Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Error updating product");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      category: "",
      brand: "",
      stock: 0,
      minStock: 0,
      unit: "pcs",
      weight: 0,
      status: "active",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showEditModal && selectedProduct) {
      // Send the quantity only when the administrator changed it; otherwise a
      // sale made while the form was open would look like a conflicting edit.
      const { stock, ...otherFields } = formData;
      const stockChanged = stock !== selectedProduct.stock;
      updateProduct(selectedProduct._id, stockChanged ? formData : otherFields, stockChanged ? selectedProduct.stock : undefined);
    } else {
      createProduct(formData);
    }
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData(product);
    setShowEditModal(true);
  };

  const openViewModal = (product: Product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Function to display stock information based on user role
  const renderStockInfo = (product: Product) => {
    if (isAdmin) {
      // Admin sees exact stock numbers
      return (
        <span
          className={`text-sm ${
            product.stock <= product.minStock
              ? "text-red-600 font-medium"
              : "text-gray-900"
          }`}
        >
          {product.stock} {product.unit}
        </span>
      );
    } else {
      // Staff sees stock status instead of exact numbers
      if (product.stock === 0) {
        return (
          <span className="text-sm text-red-600 font-medium">En rupture</span>
        );
      } else if (product.stock <= product.minStock) {
        return (
          <span className="text-sm text-orange-600 font-medium">Stock faible</span>
        );
      } else {
        return (
          <span className="text-sm text-green-600 font-medium">En stock</span>
        );
      }
    }
  };

  // Function to display stock details in view modal based on user role
  const renderStockDetails = (product: Product) => {
    if (isAdmin) {
      // Admin sees all stock details
      return (
        <>
          <div className="flex justify-between">
            <span className="text-gray-600">Stock Actuel:</span>
            <span
              className={`font-medium ${
                product.stock <= product.minStock
                  ? "text-red-600"
                  : "text-gray-900"
              }`}
            >
              {product.stock} {product.unit}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Stock minimal:</span>
            <span className="font-medium">
              {product.minStock} {product.unit}
            </span>
          </div>
        </>
      );
    } else {
      // Staff sees only stock status
      return (
        <div className="flex justify-between">
          <span className="text-gray-600">Statut du stock:</span>
          {product.stock === 0 ? (
            <span className="font-medium text-red-600">En rupture</span>
          ) : product.stock <= product.minStock ? (
            <span className="font-medium text-orange-600">Stock faible</span>
          ) : (
            <span className="font-medium text-green-600">En stock</span>
          )}
        </div>
      );
    }
  };

  return (
    <div className="page space-y-5">
      <header className="page-header">
        <div>
          <h1 className="page-title">Articles</h1>
          <p className="page-subtitle">Catalogue, prix et disponibilité des articles.</p>
        </div>
        <div className="page-actions">
          {/* The add/edit dialog is admin-only (unchanged), so is its trigger. */}
          {isAdmin ? (
            <button type="button" onClick={() => setShowAddModal(true)} className="btn btn-primary">
              <Plus aria-hidden="true" />
              Nouvel article
            </button>
          ) : (
            <span className="badge"><Eye aria-hidden="true" />Consultation</span>
          )}
        </div>
      </header>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="input-group">
              <Search aria-hidden="true" />
              <input aria-label="Rechercher un article"
                type="search"
                placeholder="Rechercher un article par nom…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input"
              />
            </div>
          </div>
          <div className="sm:w-64">
            <CategoriesDropdown
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <section className="card" aria-label="Liste des articles">
        {loading ? (
          <LoadingState label="Chargement des articles…" />
        ) : filteredProducts.length === 0 ? (
          <EmptyState title="Aucun article trouvé" icon={<Package aria-hidden="true" />}>
            Modifiez la recherche ou la catégorie sélectionnée.
          </EmptyState>
        ) : (
          <div>
            <ResponsiveTable className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Article
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
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
                {filteredProducts.map((product, idx) => (
                  <tr key={product._id ?? idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.brand}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStockInfo(product)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`badge ${
                          product.status === "active"
                            ? "badge-success"
                            : "badge-danger"
                        }`}
                      >
                        {getProductStatus(product.status)}
                      </span>
                      {product.status === "active" && !isProductSellable(product) && (
                        <span className="badge badge-danger ml-1" title="0 pièce : retiré automatiquement de la vente">Non vendable</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button aria-label={`Voir les détails de ${product.name}`} title="Détails"
                          onClick={() => openViewModal(product)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        >
                          <Eye className="w-4 h-4" aria-hidden="true" /><span className="ui-action-label">Détails</span>
                        </button>
                        {isAdmin && (
                          <>
                            <button aria-label={`Fiche de stock de ${product.name}`} title="Fiche de stock"
                              onClick={() => setStockCardProduct(product)}
                              className="text-gray-700 hover:text-gray-900 p-1 rounded"
                            >
                              <ClipboardList className="w-4 h-4" aria-hidden="true" /><span className="ui-action-label">Fiche de stock</span>
                            </button>
                            <button aria-label={`Mouvement de stock pour ${product.name}`} title="Mouvement de stock"
                              onClick={() => setMovementProduct(product)}
                              className="text-gray-700 hover:text-gray-900 p-1 rounded"
                            >
                              <ArrowDownUp className="w-4 h-4" aria-hidden="true" /><span className="ui-action-label">Entrée / correction</span>
                            </button>
                            <button aria-label={`Modifier ${product.name}`} title="Modifier"
                              onClick={() => openEditModal(product)}
                              className="text-gray-700 hover:text-gray-900 p-1 rounded"
                            >
                              <Edit className="w-4 h-4" aria-hidden="true" /><span className="ui-action-label">Modifier</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </ResponsiveTable>
          </div>
        )}
      </section>

      {/* Add/Edit Product Modal - Only for Admin */}
      {(showAddModal || showEditModal) && isAdmin && (
        <Dialog label={showEditModal ? "Modifier l'article" : "Nouvel article"} onClose={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {showEditModal ? "Modifier l'Article" : "Ajouter un Article"}
                </h2>
                <button aria-label="Fermer"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Information Basique
                  </h3>

                  <div>
                    <label htmlFor="products-field-16985" className="block text-sm font-medium text-gray-700 mb-1">
                      Nom de l'Article *
                    </label>
                    <input id="products-field-16985"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="products-field-17739" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea id="products-field-17739"
                      rows={3}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categorie *
                    </label>
                    <CategoriesDropdown
                      selectedCategory={formData.category || ""}
                      setSelectedCategory={(categoryName) =>
                        setFormData((prev) => ({
                          ...prev,
                          category: categoryName,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label htmlFor="products-field-19059" className="block text-sm font-medium text-gray-700 mb-1">
                      Marques
                    </label>
                    <input id="products-field-19059"
                      type="text"
                      value={formData.brand}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          brand: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="products-field-19778" className="block text-sm font-medium text-gray-700 mb-1">
                      Statut
                    </label>
                    <select id="products-field-19778"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          status: e.target.value as "active" | "inactive",
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none focus:border-transparent"
                    >
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                    </select>
                  </div>
                </div>

                {/* Pricing & Inventory */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Prix & Stock
                  </h3>

                  <div>
                    <label htmlFor="products-field-20897" className="block text-sm font-medium text-gray-700 mb-1">
                      Prix par défaut (USD)
                    </label>
                    <input id="products-field-20897"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          price: Number.parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Ce prix préremplit la vente; les utilisateurs autorisés peuvent le modifier.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="products-field-21956" className="block text-sm font-medium text-gray-700 mb-1">
                        Stock Total
                      </label>
                      <input id="products-field-21956"
                        type="number"
                        value={formData.stock}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            stock: Number.parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none focus:border-transparent"
                      />
                      {showEditModal && (
                        <p className="mt-1 text-xs text-gray-500">
                          Une modification ici est enregistrée comme correction. Pour une livraison, utilisez « Entrée / correction ».
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="products-field-22728" className="block text-sm font-medium text-gray-700 mb-1">
                        Unité
                      </label>
                      <select id="products-field-22728"
                        value={formData.unit}
                        disabled={showEditModal}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            unit: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                      >
                        {units.map((unit, idx) => (
                          <option key={idx} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                      {showEditModal && (
                        <p className="mt-1 text-xs text-gray-500">L'unité reste fixe pour préserver l'historique de la fiche de stock.</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="products-field-23780" className="block text-sm font-medium text-gray-700 mb-1">
                        Stock minimum
                      </label>
                      <input id="products-field-23780"
                        type="number"
                        value={formData.minStock}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            minStock: Number.parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {showEditModal ? "Mettre à jour l'Article" : "Ajouter l'Article"}
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}

      {/* Quick View Modal */}
      {showViewModal && selectedProduct && (
        <Dialog label="Détails de l'Article" onClose={() => setShowViewModal(false)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Détails de l'Article
                </h2>
                <button aria-label="Fermer"
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-start gap-6">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedProduct.name}
                  </h3>
                  <p className="text-gray-600 mt-1">{selectedProduct.brand}</p>
                  <p className="text-gray-700 mt-2">
                    {selectedProduct.description}
                  </p>
                  <div className="mt-4 flex items-center gap-4">
                    {typeof selectedProduct.price === "number" && (
                      <span className="text-2xl font-bold text-green-600">
                        ${selectedProduct.price.toFixed(2)}
                      </span>
                    )}
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedProduct.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {getProductStatus(selectedProduct.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">
                    Informations sur l'Article
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Categorie:</span>
                      <span className="font-medium">
                        {selectedProduct.category}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Unité:</span>
                      <span className="font-medium">
                        {selectedProduct.unit}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Stock</h4>
                  <div className="space-y-2 text-sm">
                    {renderStockDetails(selectedProduct)}
                  </div>
                </div>
              </div>

              {selectedProduct.weight > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">
                    Propriétés physiques
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Poids:</span>
                      <span className="font-medium">
                        {selectedProduct.weight} kg
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {isAdmin && (
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setStockCardProduct(selectedProduct);
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <ClipboardList className="w-4 h-4" />
                    Fiche de stock
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      openEditModal(selectedProduct);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Modifier l'Article
                  </button>
                </div>
              )}
            </div>
          </div>
        </Dialog>
      )}

      {stockCardProduct && isAdmin && (
        <StockCardDialog
          productId={stockCardProduct._id}
          productName={stockCardProduct.name}
          onClose={() => setStockCardProduct(null)}
        />
      )}

      {movementProduct && isAdmin && (
        <StockMovementDialog
          product={movementProduct}
          onClose={() => setMovementProduct(null)}
          onSaved={(updated) => {
            setProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
            setMovementProduct(null);
            toast.success("Mouvement de stock enregistré");
          }}
        />
      )}
    </div>
  );
}
