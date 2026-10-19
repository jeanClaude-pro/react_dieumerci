import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownUp, Boxes, ClipboardList, Edit, Eye, Package, Plus, Search, TrendingDown, X,
} from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import ResponsiveTable from "../../components/ui/ResponsiveTable";
import Dialog from "../../components/ui/Dialog";
import PageHeader from "../../components/ui/PageHeader";
import { EmptyState, LoadingState } from "../../components/ui/States";
import type { Product } from "../../types";
import { units, serverUrl } from "../../utils/constants";
import CategoriesDropdown from "../../components/CategoriesDropdown";
import StockCardDialog from "../../components/inventory/StockCardDialog";
import StockMovementDialog from "../../components/inventory/StockMovementDialog";
import { isProductSellable, stockHealth } from "../../utils/productAvailability";
import { formatNumber } from "../../i18n/format";

interface StoredUser {
  role?: string;
}

type StatusFilter = "all" | "available" | "low" | "out" | "inactive";

const EMPTY_FORM: Partial<Product> = {
  name: "",
  description: "",
  category: "",
  brand: "",
  stock: 0,
  minStock: 0,
  unit: "pcs",
  weight: 0,
  status: "active",
};

function readUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Products() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockCardProduct, setStockCardProduct] = useState<Product | null>(null);
  const [movementProduct, setMovementProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [currentUser] = useState<StoredUser | null>(readUser);

  // Display only: the server refuses every product write from a non-admin.
  const isAdmin = currentUser?.role === "admin";
  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token") || ""}` });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${serverUrl}/products?includeInactive=true`, { headers: authHeaders() });
      if (response.ok) {
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : []);
      } else {
        toast.error(t("products.toast.loadError"));
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error(t("products.toast.loadError"));
    } finally {
      setLoading(false);
    }
  };
  // Latest fetchProducts for the mount effect below.
  const fetchProductsRef = useRef(fetchProducts);
  fetchProductsRef.current = fetchProducts;
  useEffect(() => { fetchProductsRef.current(); }, []);

  const closeForm = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setFormData(EMPTY_FORM);
  };

  const createProduct = async (productData: Partial<Product>) => {
    setSaving(true);
    try {
      const response = await fetch(`${serverUrl}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(productData),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setProducts((previous) => [data, ...previous]);
        closeForm();
        toast.success(t("products.toast.created"));
      } else {
        toast.error(data?.error || t("products.toast.createError"));
      }
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error(t("products.toast.createError"));
    } finally {
      setSaving(false);
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>, expectedStock?: number) => {
    setSaving(true);
    try {
      const response = await fetch(`${serverUrl}/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        // expectedStock = the quantity shown when the form opened: the server
        // refuses the edit if a sale changed the stock in the meantime.
        body: JSON.stringify({ ...productData, expectedStock }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setProducts((previous) => previous.map((product) => (product._id === id ? data : product)));
        closeForm();
        toast.success(t("products.toast.updated"));
      } else {
        toast.error(data?.error || t("products.toast.updateError"));
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error(t("products.toast.updateError"));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
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
    // Prices are never managed here: every selling price is typed at the till.
    setFormData({
      ...EMPTY_FORM,
      name: product.name,
      description: product.description,
      category: product.category,
      brand: product.brand,
      stock: product.stock,
      minStock: product.minStock,
      unit: product.unit,
      weight: product.weight,
      status: product.status,
    });
    setShowEditModal(true);
  };

  const openViewModal = (product: Product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const matchesStatus = (product: Product, filter: StatusFilter) => {
    const health = stockHealth(product);
    switch (filter) {
      case "available": return product.status === "active" && health !== "out";
      case "low": return product.status === "active" && health === "low";
      case "out": return product.status === "active" && health === "out";
      case "inactive": return product.status !== "active";
      default: return true;
    }
  };

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return products.filter((product) =>
      (!term || product.name.toLowerCase().includes(term) || (product.brand || "").toLowerCase().includes(term))
      && (!selectedCategory || product.category === selectedCategory)
      && matchesStatus(product, statusFilter));
  }, [products, searchTerm, selectedCategory, statusFilter]);

  // Catalogue summary over the loaded list (the server already returned every product).
  const summary = useMemo(() => {
    const counts: Record<StatusFilter, number> = { all: products.length, available: 0, low: 0, out: 0, inactive: 0 };
    for (const product of products) {
      (["available", "low", "out", "inactive"] as StatusFilter[]).forEach((key) => { if (matchesStatus(product, key)) counts[key] += 1; });
    }
    return { counts };
  }, [products]);

  const stockLabel = (product: Product) => {
    const health = stockHealth(product);
    if (isAdmin) {
      return <span className={`num ${health === "ok" ? "" : health === "out" ? "text-loss" : "stock-low"}`}><strong>{formatNumber(product.stock, 3)}</strong> {product.unit}</span>;
    }
    // Other roles see availability, not exact quantities (unchanged rule).
    return health === "out"
      ? <span className="badge badge-danger">{t("products.stock.out")}</span>
      : health === "low" ? <span className="badge badge-warning">{t("products.stock.low")}</span>
        : <span className="badge badge-success">{t("products.stock.in")}</span>;
  };

  const chips: StatusFilter[] = ["all", "available", "low", "out", "inactive"];

  return (
    <div className="page products-page">
      <PageHeader
        eyebrow={t("nav.sections.stock")}
        icon={<Package aria-hidden="true" />}
        title={t("products.title")}
        description={t("products.subtitle")}
        actions={isAdmin ? (
          <button type="button" onClick={() => { setFormData(EMPTY_FORM); setShowAddModal(true); }} className="btn btn-primary">
            <Plus aria-hidden="true" />{t("products.add")}
          </button>
        ) : (
          <span className="badge"><Eye aria-hidden="true" />{t("products.readOnly")}</span>
        )}
      />

      <section className="product-kpis" aria-label={t("products.kpi.label")}>
        <div className="product-kpi">
          <span className="product-kpi-icon"><Boxes aria-hidden="true" /></span>
          <span><small>{t("products.kpi.catalogue")}</small><strong>{formatNumber(summary.counts.all, 0)}</strong><em>{t("products.kpi.catalogueDetail", { available: summary.counts.available, inactive: summary.counts.inactive })}</em></span>
        </div>
        <button type="button" className={`product-kpi is-button ${summary.counts.low + summary.counts.out ? "is-warning" : ""}`} onClick={() => setStatusFilter(summary.counts.out ? "out" : "low")}>
          <span className="product-kpi-icon"><TrendingDown aria-hidden="true" /></span>
          <span><small>{t("products.kpi.attention")}</small><strong>{formatNumber(summary.counts.low + summary.counts.out, 0)}</strong><em>{t("products.kpi.attentionDetail", { low: summary.counts.low, out: summary.counts.out })}</em></span>
        </button>
      </section>

      <div className="card product-filters">
        <div className="input-group product-search">
          <Search aria-hidden="true" />
          <input aria-label={t("products.searchLabel")} type="search" placeholder={t("products.searchPlaceholder")}
            value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="input" />
        </div>
        <div className="product-category">
          <CategoriesDropdown selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />
        </div>
        <div className="chip-row" role="radiogroup" aria-label={t("products.filterLabel")}>
          {chips.map((chip) => (
            <button key={chip} type="button" role="radio" aria-checked={statusFilter === chip} className={`filter-chip ${statusFilter === chip ? "is-active" : ""}`} onClick={() => setStatusFilter(chip)}>
              {t(`products.filters.${chip}`)}<span className="filter-chip-count">{summary.counts[chip]}</span>
            </button>
          ))}
        </div>
      </div>

      <section className="card" aria-label={t("products.listLabel")}>
        {loading ? (
          <LoadingState label={t("products.loading")} />
        ) : filteredProducts.length === 0 ? (
          <EmptyState title={t("products.emptyTitle")} icon={<Package aria-hidden="true" />}>{t("products.emptyBody")}</EmptyState>
        ) : (
          <ResponsiveTable className="w-full products-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t("products.col.product")}</th>
                <th>{t("products.col.category")}</th>
                <th>{t("products.col.stock")}</th>
                <th>{t("products.col.status")}</th>
                <th>{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => (
                <tr key={product._id ?? index}>
                  <td className="text-gray-500 num">{index + 1}</td>
                  <td>
                    <strong className="block">{product.name}</strong>
                    {product.brand && <small className="text-gray-500">{product.brand}</small>}
                  </td>
                  <td>{product.category}</td>
                  <td>{stockLabel(product)}</td>
                  <td>
                    <span className={`badge ${product.status === "active" ? "badge-success" : "badge-danger"}`}>{product.status === "active" ? t("common.active") : t("common.inactive")}</span>
                    {product.status === "active" && !isProductSellable(product) && (
                      <span className="badge badge-danger ml-1" title={t("products.notSellableHint")}>{t("products.notSellable")}</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button type="button" aria-label={t("products.actions.viewAria", { name: product.name })} title={t("common.details")} onClick={() => openViewModal(product)} className="btn btn-ghost btn-sm">
                        <Eye aria-hidden="true" /><span className="ui-action-label">{t("common.details")}</span>
                      </button>
                      {isAdmin && (
                        <>
                          <button type="button" aria-label={t("products.actions.cardAria", { name: product.name })} title={t("products.actions.card")} onClick={() => setStockCardProduct(product)} className="btn btn-ghost btn-sm">
                            <ClipboardList aria-hidden="true" /><span className="ui-action-label">{t("products.actions.card")}</span>
                          </button>
                          <button type="button" aria-label={t("products.actions.movementAria", { name: product.name })} title={t("products.actions.movement")} onClick={() => setMovementProduct(product)} className="btn btn-ghost btn-sm">
                            <ArrowDownUp aria-hidden="true" /><span className="ui-action-label">{t("products.actions.movement")}</span>
                          </button>
                          <button type="button" aria-label={t("products.actions.editAria", { name: product.name })} title={t("common.edit")} onClick={() => openEditModal(product)} className="btn btn-ghost btn-sm">
                            <Edit aria-hidden="true" /><span className="ui-action-label">{t("common.edit")}</span>
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

      {(showAddModal || showEditModal) && isAdmin && (
        <Dialog label={showEditModal ? t("products.form.editTitle") : t("products.form.addTitle")} onClose={closeForm}>
          <div className="dialog-panel product-form-panel">
            <header className="dialog-head">
              <div>
                <h2 className="dialog-title">{showEditModal ? t("products.form.editTitle") : t("products.form.addTitle")}</h2>
                <p className="dialog-subtitle">{t("products.form.subtitle")}</p>
              </div>
              <button type="button" className="btn btn-ghost btn-icon" aria-label={t("common.close")} onClick={closeForm}><X aria-hidden="true" /></button>
            </header>
            <form onSubmit={handleSubmit}>
              <div className="dialog-body product-form-grid">
                <fieldset className="form-section">
                  <legend>{t("products.form.identity")}</legend>
                  <label className="field">
                    <span className="field-label">{t("products.form.name")} *</span>
                    <input className="input" type="text" required value={formData.name} onChange={(event) => setFormData((previous) => ({ ...previous, name: event.target.value }))} />
                  </label>
                  <div className="field">
                    <span className="field-label">{t("products.form.category")} *</span>
                    <CategoriesDropdown selectedCategory={formData.category || ""} setSelectedCategory={(category) => setFormData((previous) => ({ ...previous, category }))} />
                  </div>
                  <div className="form-row">
                    <label className="field">
                      <span className="field-label">{t("products.form.brand")}</span>
                      <input className="input" type="text" value={formData.brand} onChange={(event) => setFormData((previous) => ({ ...previous, brand: event.target.value }))} />
                    </label>
                    <label className="field">
                      <span className="field-label">{t("products.form.status")}</span>
                      <select className="input" value={formData.status} onChange={(event) => setFormData((previous) => ({ ...previous, status: event.target.value as "active" | "inactive" }))}>
                        <option value="active">{t("common.active")}</option>
                        <option value="inactive">{t("common.inactive")}</option>
                      </select>
                    </label>
                  </div>
                  <label className="field">
                    <span className="field-label">{t("products.form.description")}</span>
                    <textarea className="input" rows={2} value={formData.description} onChange={(event) => setFormData((previous) => ({ ...previous, description: event.target.value }))} />
                  </label>
                </fieldset>

                <fieldset className="form-section">
                  <legend>{t("products.form.stockSection")}</legend>
                  <div className="form-row">
                    <label className="field">
                      <span className="field-label">{t("products.form.stock")}</span>
                      <input className="input num" type="number" value={formData.stock} onChange={(event) => setFormData((previous) => ({ ...previous, stock: Number.parseInt(event.target.value) || 0 }))} />
                      {showEditModal && <span className="field-hint">{t("products.form.stockHint")}</span>}
                    </label>
                    <label className="field">
                      <span className="field-label">{t("products.form.unit")}</span>
                      <select className="input" value={formData.unit} disabled={showEditModal} onChange={(event) => setFormData((previous) => ({ ...previous, unit: event.target.value }))}>
                        {units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                      </select>
                      {showEditModal && <span className="field-hint">{t("products.form.unitHint")}</span>}
                    </label>
                  </div>
                  <label className="field">
                    <span className="field-label">{t("products.form.minStock")}</span>
                    <input className="input num" type="number" value={formData.minStock} onChange={(event) => setFormData((previous) => ({ ...previous, minStock: Number.parseInt(event.target.value) || 0 }))} />
                    <span className="field-hint">{t("products.form.minStockHint")}</span>
                  </label>
                </fieldset>
              </div>
              <footer className="dialog-foot">
                <button type="button" onClick={closeForm} className="btn btn-secondary">{t("common.cancel")}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{showEditModal ? t("products.form.update") : t("products.form.create")}</button>
              </footer>
            </form>
          </div>
        </Dialog>
      )}

      {showViewModal && selectedProduct && (
        <Dialog label={t("products.view.title")} onClose={() => setShowViewModal(false)}>
          <div className="dialog-panel product-view-panel">
            <header className="dialog-head">
              <div>
                <h2 className="dialog-title">{selectedProduct.name}</h2>
                <p className="dialog-subtitle">{[selectedProduct.brand, selectedProduct.category].filter(Boolean).join(" · ")}</p>
              </div>
              <button type="button" className="btn btn-ghost btn-icon" aria-label={t("common.close")} onClick={() => setShowViewModal(false)}><X aria-hidden="true" /></button>
            </header>
            <div className="dialog-body product-view">
              {selectedProduct.description && <p className="product-view-desc">{selectedProduct.description}</p>}
              <dl className="product-facts">
                <div><dt>{t("products.form.unit")}</dt><dd>{selectedProduct.unit}</dd></div>
                <div><dt>{t("products.col.status")}</dt><dd>{selectedProduct.status === "active" ? t("common.active") : t("common.inactive")}</dd></div>
                <div><dt>{t("products.col.stock")}</dt><dd>{stockLabel(selectedProduct)}</dd></div>
                {isAdmin && <div><dt>{t("products.form.minStock")}</dt><dd className="num">{formatNumber(selectedProduct.minStock, 3)} {selectedProduct.unit}</dd></div>}
                {selectedProduct.weight > 0 && <div><dt>{t("products.view.weight")}</dt><dd className="num">{formatNumber(selectedProduct.weight)} kg</dd></div>}
              </dl>
            </div>
            {isAdmin && (
              <footer className="dialog-foot">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowViewModal(false); setStockCardProduct(selectedProduct); }}>
                  <ClipboardList aria-hidden="true" />{t("products.actions.card")}
                </button>
                <button type="button" className="btn btn-primary" onClick={() => { setShowViewModal(false); openEditModal(selectedProduct); }}>
                  <Edit aria-hidden="true" />{t("products.view.edit")}
                </button>
              </footer>
            )}
          </div>
        </Dialog>
      )}

      {stockCardProduct && isAdmin && (
        <StockCardDialog productId={stockCardProduct._id} productName={stockCardProduct.name} onClose={() => setStockCardProduct(null)} />
      )}

      {movementProduct && isAdmin && (
        <StockMovementDialog
          product={movementProduct}
          onClose={() => setMovementProduct(null)}
          onSaved={(updated) => {
            setProducts((previous) => previous.map((product) => (product._id === updated._id ? updated : product)));
            setMovementProduct(null);
            toast.success(t("products.toast.movementSaved"));
          }}
        />
      )}
    </div>
  );
}
