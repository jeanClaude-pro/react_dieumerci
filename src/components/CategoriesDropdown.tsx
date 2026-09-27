import { useEffect, useState } from "react";
import { serverUrl } from "../utils/constants";
import type { Category } from "../types";

type Props = {
  selectedCategory: string;
  setSelectedCategory: (categoryName: string) => void;
};

const CategoriesDropdown = ({
  selectedCategory,
  setSelectedCategory,
}: Props) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${serverUrl}/categories`);
        if (!response.ok) {
          console.error("Failed to fetch categories:", await response.text());
          return;
        }
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // We emit the NAME so it matches product.category (string) used in the filter
    setSelectedCategory(e.target.value);
  };

  // Same size while loading, so the filter bar does not shift.
  return (
    <select
      aria-label="Filtrer par catégorie"
      value={selectedCategory}
      onChange={handleChange}
      disabled={loading}
      className="input"
    >
      <option value="">{loading ? "Chargement des catégories…" : "Toutes les catégories"}</option>
      {categories.map((category) => (
        <option key={category._id} value={category.name}>
          {category.name}
        </option>
      ))}
    </select>
  );
};

export default CategoriesDropdown;
