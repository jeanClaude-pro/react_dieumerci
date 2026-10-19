import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import type { Category } from "../types";
import { useTranslation } from "react-i18next";

type Props = {
  selectedCategory: string;
  setSelectedCategory: (categoryName: string) => void;
};

const CategoriesDropdown = ({
  selectedCategory,
  setSelectedCategory,
}: Props) => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await apiFetch<Category[]>("categories");
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
      aria-label={t("categories.filterLabel")}
      value={selectedCategory}
      onChange={handleChange}
      disabled={loading}
      className="input"
    >
      <option value="">{loading ? t("categories.loading") : t("categories.all")}</option>
      {categories.map((category) => (
        <option key={category._id} value={category.name}>
          {category.name}
        </option>
      ))}
    </select>
  );
};

export default CategoriesDropdown;
