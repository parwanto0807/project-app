export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  isMain: boolean;
  isActive: boolean;
  createdAt: string; // ISO string dari backend
  updatedAt: string;
}
