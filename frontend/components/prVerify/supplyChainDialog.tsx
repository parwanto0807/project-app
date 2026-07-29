"use client"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Package,
  ShoppingCart,
  Warehouse,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Truck,
  ArrowRight,
  PlusCircle,
} from "lucide-react"
import { PurchaseRequest } from "@/types/pr"

interface SupplyChainDialogProps {
  purchaseRequest: PurchaseRequest | null
  children?: React.ReactNode
}

interface ProductSupplyStatus {
  productId: string
  productName: string
  productCode?: string
  requestedQty: number
  unit: string
  stockPerWarehouse: {
    warehouseId: string
    warehouseName: string
    availableStock: number
    isWip: boolean
  }[]
  totalAvailableStock: number
  pendingPOs: {
    poId: string
    poNumber: string
    status: string
    qtyOrdered: number
    qtyReceived: number
    remainingQty: number
  }[]
  shortage: number
}

export function SupplyChainDialog({ purchaseRequest, children }: SupplyChainDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [supplyData, setSupplyData] = useState<ProductSupplyStatus[]>([])
  const [adjusting, setAdjusting] = useState<Record<string, boolean>>({})
  const [adjustMsg, setAdjustMsg] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open || !purchaseRequest) return
    fetchSupplyChainData()
  }, [open, purchaseRequest])

  async function fetchSupplyChainData() {
    if (!purchaseRequest?.details) return
    setLoading(true)
    try {
      const results: ProductSupplyStatus[] = []

      for (const detail of purchaseRequest.details) {
        if (!detail.productId || !detail.product) continue
        if ((detail.sourceProduct || "").toUpperCase() === "MOBILISASI") continue

        const productId = detail.productId

        const stockRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/inventory/latest-stock?productId=${productId}&detail=true`,
          { credentials: "include" }
        )
        const stockJson = await stockRes.json()

        const poRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/inventory/on-po?productId=${productId}`,
          { credentials: "include" }
        )
        const poJson = await poRes.json()

        const poData = Array.isArray(poJson?.data) ? poJson.data : []

        const breakdown = Array.isArray(stockJson?.breakdown)
          ? stockJson.breakdown.map((b: any) => ({
              warehouseId: b.warehouseId,
              warehouseName: b.warehouseName,
              availableStock: Number(b.availableStock ?? b.stock ?? 0),
              isWip: !!b.isWip,
            }))
          : []

        const totalAvailableStock = breakdown.reduce((sum: number, b: any) => sum + b.availableStock, 0)

        const pendingPOs = poData
          .filter((po: any) => po.status !== "FULLY_RECEIVED" && po.status !== "CANCELLED")
          .map((po: any) => ({
            poId: po.poId || po.id,
            poNumber: po.poNumber || "-",
            status: po.status,
            qtyOrdered: Number(po.qtyOrdered ?? po.quantity ?? 0),
            qtyReceived: Number(po.qtyReceived ?? 0),
            remainingQty: Number(po.remainingQty ?? po.qtyOrdered ?? 0) - Number(po.qtyReceived ?? 0),
          }))

        const totalIncoming = pendingPOs.reduce((sum, po) => sum + Math.max(0, po.remainingQty), 0)
        const shortage = Math.max(0, Number(detail.jumlah) - totalAvailableStock - totalIncoming)

        results.push({
          productId: detail.productId,
          productName: detail.product.name || "Unknown",
          productCode: detail.product.code,
          requestedQty: Number(detail.jumlah),
          unit: detail.satuan || detail.product.storageUnit || "pcs",
          stockPerWarehouse: breakdown,
          totalAvailableStock,
          pendingPOs,
          shortage,
        })
      }

      setSupplyData(results)
    } catch (err) {
      console.error("Failed to fetch supply chain data:", err)
    } finally {
      setLoading(false)
    }
  }

  async function getWipWarehouseId(): Promise<string | null> {
    const found = supplyData.flatMap((s) => s.stockPerWarehouse).find((wh) => wh.isWip)
    if (found) return found.warehouseId
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/warehouse`, { credentials: "include" })
      const json = await res.json()
      if (Array.isArray(json)) {
        const wip = json.find((w: any) => w.isWip)
        if (wip) return wip.id
      }
      if (json.data && Array.isArray(json.data)) {
        const wip = json.data.find((w: any) => w.isWip)
        if (wip) return wip.id
      }
    } catch {}
    return null
  }

  async function handleQuickAdjust(item: ProductSupplyStatus) {
    if (!purchaseRequest) return
    setAdjusting((prev) => ({ ...prev, [item.productId]: true }))
    setAdjustMsg((prev) => ({ ...prev, [item.productId]: "" }))
    try {
      const wipInBreakdown = item.stockPerWarehouse.find((wh) => wh.isWip)
      let warehouseId = wipInBreakdown?.warehouseId
      if (!warehouseId) warehouseId = await getWipWarehouseId()
      if (!warehouseId) {
        setAdjustMsg((prev) => ({ ...prev, [item.productId]: "Gudang WIP tidak ditemukan" }))
        setAdjusting((prev) => ({ ...prev, [item.productId]: false }))
        return
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stock-opname/quick-adjust`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: item.productId,
          warehouseId,
          qty: item.shortage,
          hargaSatuan: 0,
          referenceNo: purchaseRequest.nomorPr,
          notes: `Penyesuaian Stock Opname dari PR ${purchaseRequest.nomorPr}`,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setAdjustMsg((prev) => ({ ...prev, [item.productId]: `Berhasil +${item.shortage} ${item.unit}` }))
        fetchSupplyChainData()
      } else {
        setAdjustMsg((prev) => ({ ...prev, [item.productId]: json.message || "Gagal" }))
      }
    } catch (err) {
      setAdjustMsg((prev) => ({ ...prev, [item.productId]: "Error koneksi" }))
    } finally {
      setAdjusting((prev) => ({ ...prev, [item.productId]: false }))
    }
  }

  const totalShortage = supplyData.reduce((sum, item) => sum + item.shortage, 0)
  const totalPendingItems = supplyData.filter((item) => item.pendingPOs.length > 0).length
  const totalBlockedItems = supplyData.filter((item) => item.shortage > 0).length

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Truck className="h-5 w-5 text-blue-600" />
              Status Pengadaan & Stok
            </DialogTitle>
            <DialogDescription>
              {purchaseRequest?.nomorPr} — Rantai pasok per item
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-muted-foreground">Memuat data rantai pasok...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {totalBlockedItems > 0 && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                  <span>
                    <strong>{totalBlockedItems} item</strong> kekurangan stok. Selisih total:{" "}
                    <strong>{totalShortage.toLocaleString("id-ID")}</strong> unit.
                    {totalPendingItems > 0 &&
                      ` ${totalPendingItems} item memiliki PO pending — selesaikan GR terlebih dahulu.`}
                  </span>
                </div>
              )}
              {totalBlockedItems === 0 && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                  <span>Semua item tercukupi oleh stok yang ada atau PO yang belum diterima.</span>
                </div>
              )}

              {supplyData.map((item, idx) => (
                <Card key={item.productId} className={item.shortage > 0 ? "border-red-300" : ""}>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-muted-foreground">{idx + 1}.</span>
                        <Package className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <span className="truncate font-medium">{item.productName}</span>
                        {item.productCode && (
                          <span className="text-xs text-muted-foreground">({item.productCode})</span>
                        )}
                      </div>
                      <Badge
                        variant={item.shortage > 0 ? "destructive" : "outline"}
                        className="flex-shrink-0 ml-2"
                      >
                        {item.shortage > 0
                          ? `Kurang ${item.shortage} ${item.unit}`
                          : `Cukup`}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-4 space-y-3">
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="bg-blue-50 rounded p-2 text-center">
                        <div className="text-xs text-muted-foreground">Diminta</div>
                        <div className="font-semibold text-blue-700">
                          {item.requestedQty.toLocaleString("id-ID")} {item.unit}
                        </div>
                      </div>
                      <div className="bg-green-50 rounded p-2 text-center">
                        <div className="text-xs text-muted-foreground">Stok Tersedia</div>
                        <div className="font-semibold text-green-700">
                          {item.totalAvailableStock.toLocaleString("id-ID")} {item.unit}
                        </div>
                      </div>
                      <div className="bg-amber-50 rounded p-2 text-center">
                        <div className="text-xs text-muted-foreground">Incoming (PO)</div>
                        <div className="font-semibold text-amber-700">
                          {item.pendingPOs.reduce((s, po) => s + po.remainingQty, 0).toLocaleString("id-ID")}{" "}
                          {item.unit}
                        </div>
                      </div>
                    </div>

                    {item.stockPerWarehouse.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1.5">
                          <Warehouse className="h-3 w-3" />
                          Stok per Gudang
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {item.stockPerWarehouse.map((wh) => (
                            <Badge
                              key={wh.warehouseId}
                              variant="outline"
                              className={`text-xs ${wh.isWip ? "bg-purple-50 border-purple-200 text-purple-700" : "bg-gray-50"}`}
                            >
                              {wh.warehouseName}: {wh.availableStock.toLocaleString("id-ID")} {item.unit}
                              {wh.isWip && " (WIP)"}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.pendingPOs.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1.5">
                          <ShoppingCart className="h-3 w-3" />
                          PO Belum Selesai
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow className="text-xs">
                              <TableHead className="py-1">No. PO</TableHead>
                              <TableHead className="py-1">Status</TableHead>
                              <TableHead className="py-1 text-right">Qty PO</TableHead>
                              <TableHead className="py-1 text-right">Sudah GR</TableHead>
                              <TableHead className="py-1 text-right">Sisa</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {item.pendingPOs.map((po) => (
                              <TableRow key={po.poId} className="text-xs">
                                <TableCell className="py-1 font-medium">
                                  <a
                                    href={`/admin-area/logistic/purchasing/${po.poId}`}
                                    target="_blank"
                                    className="text-blue-600 hover:underline"
                                  >
                                    {po.poNumber}
                                  </a>
                                </TableCell>
                                <TableCell className="py-1">
                                  <Badge variant="outline" className="text-[10px]">
                                    {po.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-1 text-right">
                                  {po.qtyOrdered.toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell className="py-1 text-right">
                                  {po.qtyReceived.toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell className="py-1 text-right font-semibold text-amber-600">
                                  {Math.max(0, po.remainingQty).toLocaleString("id-ID")}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {item.shortage > 0 && (
                      <>
                        <div className="flex items-start gap-2 p-2 bg-red-50 rounded text-xs text-red-700">
                          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          <div>
                            Butuh <strong>{item.requestedQty.toLocaleString("id-ID")}</strong>, tersedia{" "}
                            <strong>{item.totalAvailableStock.toLocaleString("id-ID")}</strong> + incoming{" "}
                            <strong>
                              {item.pendingPOs
                                .reduce((s, po) => s + po.remainingQty, 0)
                                .toLocaleString("id-ID")}
                            </strong>
                            . Kekurangan: <strong>{item.shortage.toLocaleString("id-ID")} {item.unit}</strong>.
                            Selesaikan GR pada PO di atas atau lakukan Transfer Stock.
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                            disabled={adjusting[item.productId]}
                            onClick={() => handleQuickAdjust(item)}
                          >
                            {adjusting[item.productId] ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                            ) : (
                              <PlusCircle className="h-3.5 w-3.5 mr-1" />
                            )}
                            {adjusting[item.productId]
                              ? "Memproses..."
                              : `Tambah ${item.shortage} ${item.unit} ke WIP`}
                          </Button>
                          {adjustMsg[item.productId] && (
                            <span
                              className={`text-xs ${
                                adjustMsg[item.productId].startsWith("Berhasil")
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {adjustMsg[item.productId]}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
