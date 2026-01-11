export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  isMain: boolean;
  isActive: boolean;
  isWip: boolean;
  inventoryAccountId?: string | null;
  inventoryAccount?: {
    id: string;
    code: string;
    name: string;
  } | null;
  createdAt: string; // ISO string dari backend
  updatedAt: string;
}
