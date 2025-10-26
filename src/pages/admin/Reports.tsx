import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { supabase, Order } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { FileDown, Calendar, FileText } from "lucide-react"
import jsPDF from "jspdf"
import Papa from "papaparse"
import { formatCurrency, formatDate } from "@/lib/format"

interface OrderItem {
  id: string
  product_id: string
  quantity: number
  subtotal: number
  products?: { name: string; price: number }
}

export default function Reports() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    fetchOrders()
  }, [dateRange])

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end + "T23:59:59")
        .order("created_at", { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  const handleViewReceipt = async (order: Order) => {
    setSelectedOrder(order)
    setReceiptOpen(true)

    try {
      const { data, error } = await supabase
        .from("order_items")
        .select("*, products(name, price)")
        .eq("order_id", order.id)

      if (error) throw error
      setOrderItems(data || [])
    } catch (error) {
      console.error("Error fetching order items:", error)
      toast.error("Failed to load order items")
    }
  }

  const generateReceiptHTML = (order: Order, items: OrderItem[]) => {
    return `<!DOCTYPE html>
      <html>
      <head>
        <title>Receipt #${order.id.substring(0,8)}</title>
        <style>
          body { font-family: monospace; padding: 20px; max-width: 400px; margin: 0 auto; }
          h1 { text-align: center; font-size: 18px; }
          .line { border-top: 1px dashed #000; margin: 10px 0; }
          .item { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { font-weight: bold; font-size: 16px; }
        </style>
      </head>
      <body>
        <h1>School Supplies POS</h1>
        <div class="line"></div>
        <p>Order ID: ${order.id.substring(0,8)}</p>
        <p>Date: ${formatDate(order.created_at)}</p>
        <p>Payment: ${order.payment_method.toUpperCase()}</p>
        <div class="line"></div>
        ${items
          .map(
            (i) => `
          <div class="item">
            <span>${i.products?.name || "Item"} x${i.quantity}</span>
            <span>${formatCurrency(i.subtotal)}</span>
          </div>`
          )
          .join("")}
        <div class="line"></div>
        <div class="item total">
          <span>Total:</span>
          <span>${formatCurrency(order.total)}</span>
        </div>
        <div class="line"></div>
        <p style="text-align:center;">Thank you for your purchase!</p>
      </body>
      </html>`
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    doc.setFontSize(18)
    doc.text("Sales Report", pageWidth / 2, 15, { align: "center" })
    doc.setFontSize(12)
    doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 25)

    let yPos = 35
    doc.setFontSize(10)
    doc.text("Order ID", 14, yPos)
    doc.text("Date", 60, yPos)
    doc.text("Payment", 110, yPos)
    doc.text("Total", 150, yPos)

    yPos += 5
    orders.forEach((order) => {
      if (yPos > 280) {
        doc.addPage()
        yPos = 20
      }
      doc.text(order.id.substring(0, 8), 14, yPos)
      doc.text(formatDate(order.created_at), 60, yPos)
      doc.text(order.payment_method, 110, yPos)
      doc.text(formatCurrency(order.total), 150, yPos)
      yPos += 7
    })

    const total = orders.reduce((sum, order) => sum + order.total, 0)
    yPos += 5
    doc.setFontSize(12)
    doc.text(`Total Revenue: ${formatCurrency(total)}`, 14, yPos)
    doc.save(`sales-report-${dateRange.start}-${dateRange.end}.pdf`)
    toast.success("PDF exported successfully")
  }

  const exportToCSV = () => {
    const csvData = orders.map((order) => ({
      "Order ID": order.id,
      Date: formatDate(order.created_at),
      "Payment Method": order.payment_method,
      Total: formatCurrency(order.total),
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sales-report-${dateRange.start}-${dateRange.end}.csv`
    a.click()
    toast.success("CSV exported successfully")
  }

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
        <p className="text-muted-foreground">Export and analyze sales data</p>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Report</CardTitle>
          <CardDescription>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="px-3 py-2 border rounded-md"
                />
                <span>to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="px-3 py-2 border rounded-md"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={exportToPDF} variant="outline">
                  <FileDown className="mr-2 h-4 w-4" /> Export PDF
                </Button>
                <Button onClick={exportToCSV} variant="outline">
                  <FileDown className="mr-2 h-4 w-4" /> Export CSV
                </Button>
              </div>
            </div>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mb-4 p-4 bg-accent rounded-lg">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
            <p className="text-sm text-muted-foreground">{orders.length} orders</p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono">{order.id.substring(0, 8)}</TableCell>
                  <TableCell>{formatDate(order.created_at)}</TableCell>
                  <TableCell className="capitalize">{order.payment_method}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(order.total)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewReceipt(order)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <FileText className="h-4 w-4 mr-1" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ✅ Receipt Dialog */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
            <DialogDescription>Order details and breakdown</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-2">
              <div className="text-sm">
                <p>Order ID: {selectedOrder.id.substring(0, 8)}</p>
                <p>Date: {formatDate(selectedOrder.created_at)}</p>
                <p>Payment: {selectedOrder.payment_method.toUpperCase()}</p>
              </div>

              <div className="border-t pt-2 space-y-1">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>
                      {item.products?.name} x{item.quantity}
                    </span>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-2 font-bold flex justify-between">
                <span>Total:</span>
                <span>{formatCurrency(selectedOrder.total)}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const html = generateReceiptHTML(selectedOrder, orderItems)
                    const blob = new Blob([html], { type: "text/html" })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `receipt-${selectedOrder.id.substring(0, 8)}.html`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                >
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const printWindow = window.open("", "_blank")
                    if (printWindow && selectedOrder) {
                      printWindow.document.write(generateReceiptHTML(selectedOrder, orderItems))
                      printWindow.document.close()
                      printWindow.print()
                    }
                  }}
                >
                  Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
