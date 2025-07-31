// hooks/use-categories.ts
import { useEffect, useState } from "react";

export interface Category {
  id: string;      // Sesuaikan dengan field di DB/response Anda
  name: string;    // Atau "categoryName", dll, sesuaikan!
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/master/product/kategory/getAllCategories`)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal fetch kategori");
        return res.json();
      })
      .then((data) => {
        setCategories(data); // Pastikan response sudah array
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Gagal mengambil kategori");
        setLoading(false);
      });
  }, []);

  return { categories, loading, error };
}
