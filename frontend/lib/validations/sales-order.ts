export interface SalesOrder {
  id: string
  soNumber: string
  soDate: string
  customer: {
    id: string
    name: string
    address?: string
  }
  project?: {
    id: string
    name: string
  }
  userId: string
  poNumber?: string
  type: "REGULAR" | "SUPPORT"
  createdAt: string
  items: SalesOrderItem[]
  document?: SalesOrderDocument
}

interface SalesOrderItem {
  id: string
  description: string
  qty: number | string
  unitPrice: number | string
  product?: {
    id: string
    name: string
  }
}

interface SalesOrderDocument {
  isOffer?: boolean
  isPo?: boolean
  isBap?: boolean
  isInvoice?: boolean
  isPaymentStatus?: boolean
}
