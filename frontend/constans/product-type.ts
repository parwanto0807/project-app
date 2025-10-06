// schema/product.ts

export enum ProductType {
  Material = "Material",
  Jasa = "Jasa",
  Alat = "Alat",
  FinishedGoods = "FinishedGoods",
  SparePart = "SparePart",
  Consumable = "Consumable",
  Asset = "Asset",
  Rental = "Rental",
  Software = "Software",
  Packaging = "Packaging",
  MRO = "MRO",
  Scrap = "Scrap",
  Refurbished = "Refurbished",
  Return = "Return",
}

// Kalau butuh type
export type ProductTypeKeys = keyof typeof ProductType;
export type ProductTypeValues = `${ProductType}`;
