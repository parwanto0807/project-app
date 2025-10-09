// utils/categoryRAB.ts
export enum CategoryRAB {
  PRELIMINARY = "PRELIMINARY",
  SITEPREP = "SITEPREP",
  STRUCTURE = "STRUCTURE",
  ARCHITECTURE = "ARCHITECTURE",
  MEP = "MEP",
  FINISHING = "FINISHING",
  LANDSCAPE = "LANDSCAPE",
  EQUIPMENT = "EQUIPMENT",
  OVERHEAD = "OVERHEAD",
  OTHER = "OTHER",
}

// Map urutan kategori
export const categoryOrder: Record<CategoryRAB, number> = {
  [CategoryRAB.PRELIMINARY]: 1,
  [CategoryRAB.SITEPREP]: 2,
  [CategoryRAB.STRUCTURE]: 3,
  [CategoryRAB.ARCHITECTURE]: 4,
  [CategoryRAB.MEP]: 5,
  [CategoryRAB.FINISHING]: 6,
  [CategoryRAB.LANDSCAPE]: 7,
  [CategoryRAB.EQUIPMENT]: 8,
  [CategoryRAB.OVERHEAD]: 9,
  [CategoryRAB.OTHER]: 10,
};

// Helper untuk sort
export function sortRABByCategory<T extends { category: CategoryRAB }>(
  data: T[]
) {
  return data.sort(
    (a, b) => categoryOrder[a.category] - categoryOrder[b.category]
  );
}
