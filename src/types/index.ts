export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  stock: number;
  minStock: number;
  unit: string;
  weight: number;
  status: "active" | "inactive";
  /** Last actual quantity change (not a name/price edit). */
  lastStockUpdatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  description: string;
}