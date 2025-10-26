import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase, Order } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { FileDown, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import Papa from 'papaparse';

export default function Reports() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchOrders();
  }, [dateRange]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end + 'T23:59:59')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(18);
    doc.text('Sales Report', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 25);
    
    let yPos = 35;
    doc.setFontSize(10);
    doc.text('Order ID', 14, yPos);
    doc.text('Date', 60, yPos);
    doc.text('Payment', 110, yPos);
    doc.text('Total', 150, yPos);
    
    yPos += 5;
    orders.forEach(order => {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(order.id.substring(0, 8), 14, yPos);
      doc.text(new Date(order.created_at).toLocaleDateString(), 60, yPos);
      doc.text(order.payment_method, 110, yPos);
      doc.text(`₱${order.total.toFixed(2)}`, 150, yPos);
      yPos += 7;
    });
    
    const total = orders.reduce((sum, order) => sum + order.total, 0);
    yPos += 5;
    doc.setFontSize(12);
    doc.text(`Total Revenue: ₱${total.toFixed(2)}`, 14, yPos);
    
    doc.save(`sales-report-${dateRange.start}-${dateRange.end}.pdf`);
    toast.success('PDF exported successfully');
  };

  const exportToCSV = () => {
    const csvData = orders.map(order => ({
      'Order ID': order.id,
      'Date': new Date(order.created_at).toLocaleString(),
      'Payment Method': order.payment_method,
      'Total': order.total,
    }));
    
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${dateRange.start}-${dateRange.end}.csv`;
    a.click();
    toast.success('CSV exported successfully');
  };

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
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
                  <FileDown className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
                <Button onClick={exportToCSV} variant="outline">
                  <FileDown className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-accent rounded-lg">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold">₱{totalRevenue.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">{orders.length} orders</p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">{order.id.substring(0, 8)}</TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleString()}</TableCell>
                  <TableCell className="capitalize">{order.payment_method}</TableCell>
                  <TableCell className="text-right font-medium">₱{order.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
