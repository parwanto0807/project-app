// app/sales/sales-order/create/[id]/page.tsx
"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-panel/admin-layout"
import { AdminLoading } from "@/components/admin-loading"
import { CreateQuotationFormById } from "@/components/sales/quotation/createFormDataById"
import { useCreateQuotation } from "@/hooks/use-quotation"
import { useCustomers } from "@/hooks/use-customer"
import { useProducts } from "@/hooks/use-product"
import { useTaxes } from "@/hooks/use-tax"
import { usePaymentTerms } from "@/hooks/use-paymentTerm"
import { useSalesOrder } from "@/hooks/use-salesOrder"
import { Tax, PaymentTerm, CreateQuotationRequest } from "@/types/quotation"
import { SalesOrder } from "@/schemas"

export default function CreateQuotationFromSOPage() {
  const params = useParams()
  const router = useRouter()
  const { id } = params as { id: string }

  const [selectedSalesOrder, setSelectedSalesOrder] = useState<SalesOrder | null>(null)

  // Hooks untuk data
  const createQuotationMutation = useCreateQuotation()
  const { data: customersData, isLoading: isCustomersLoading } = useCustomers()
  const { data: productsData, isLoading: isProductsLoading } = useProducts()
  const { data: taxesData, isLoading: isTaxesLoading } = useTaxes()
  const { data: paymentTermsData, isLoading: isPaymentTermsLoading } = usePaymentTerms()
  const { data: salesOrderData, isLoading: isSalesOrderLoading } = useSalesOrder()

  // Set data sales order yang dipilih
  useEffect(() => {
    if (salesOrderData?.salesOrders && id) {
      const foundOrder = salesOrderData.salesOrders.find((so: SalesOrder) => so.id === id)
      setSelectedSalesOrder(foundOrder || null)
    }
  }, [salesOrderData, id])

  const handleSubmit = async (data: CreateQuotationRequest) => {
    try {
      await createQuotationMutation.mutateAsync(data)
      router.push("/admin-area/sales/quotation")
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Gagal membuat quotation")
    }
  }

  // Loading state
  const isLoading = isSalesOrderLoading || isCustomersLoading || isProductsLoading || isTaxesLoading || isPaymentTermsLoading

  if (isLoading) {
    return (
      <AdminLayout title="Create Quotation from SO" role="admin">
        <AdminLoading message="Loading data..." />
      </AdminLayout>
    )
  }

  if (!selectedSalesOrder) {
    return (
      <AdminLayout title="Create Quotation from SO" role="admin">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-red-600">Sales Order tidak ditemukan</h2>
          <button
            onClick={() => router.push('/admin-area/sales/sales-order')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Kembali ke Sales Orders
          </button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Create Quotation from Sales Order" role="admin">
      <div className="mt-6">
        <CreateQuotationFormById
          customers={customersData?.customers || []}
          products={productsData?.products || []}
          salesOrders={salesOrderData?.salesOrders || []}
          taxes={(taxesData?.taxes || []).filter((t: Tax) => t.isActive)}
          paymentTerms={(paymentTermsData?.terms || []).filter((t: PaymentTerm) => t.isActive)}
          onSubmit={handleSubmit}
          isLoading={createQuotationMutation.isPending}
          preSelectedSalesOrderId={id}
        />
      </div>
    </AdminLayout>
  )
}