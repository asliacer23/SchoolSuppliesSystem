import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase, Product } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Search, ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';

interface CartItem extends Product {
  quantity: number;
}

export default function Order() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash' | 'card'>('cash');
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    orderId: string;
    items: CartItem[];
    subtotal: number;
    total: number;
    paymentMethod: string;
  } | null>(null);
  const [amountPaid, setAmountPaid] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let filtered = products;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .gt('stock', 0)
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(cart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        toast.error('Not enough stock');
      }
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    if (newQuantity > product.stock) {
      toast.error('Not enough stock');
      return;
    }
    setCart(cart.map(item =>
      item.id === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal; // No tax applied

  const handleCheckout = async (paidAmount: number) => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          cashier_id: user?.id,
          total,
          payment_method: paymentMethod,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      for (const item of cart) {
        const { error: itemError } = await supabase
          .from('order_items')
          .insert([{
            order_id: order.id,
            product_id: item.id,
            quantity: item.quantity,
            subtotal: item.price * item.quantity,
          }]);
        if (itemError) throw itemError;

        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: item.stock - item.quantity })
          .eq('id', item.id);
        if (stockError) throw stockError;
      }

      toast.success('Order completed successfully');
      const savedCart = [...cart];
      setCart([]);
      fetchProducts();

      setReceiptData({
        orderId: order.id,
        items: savedCart,
        subtotal,
        total,
        paymentMethod,
      });
      setAmountPaid(paidAmount);
      setReceiptOpen(true);
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to complete order');
    }
  };

  const generateReceiptHTML = (data: { orderId: string; items: CartItem[]; subtotal: number; total: number; paymentMethod: string; }, paidAmount: number) => {
    const change = Math.max(0, paidAmount - data.total);
    return `<!DOCTYPE html>
      <html>
        <head>
          <title>Receipt #${data.orderId.substring(0,8)}</title>
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
          <p>Order ID: ${data.orderId.substring(0,8)}</p>
          <p>Date: ${new Date().toLocaleString()}</p>
          <p>Payment: ${data.paymentMethod.toUpperCase()}</p>
          <div class="line"></div>
          ${data.items.map(item => `
            <div class="item">
              <span>${item.name} x${item.quantity}</span>
              <span>₱${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
          <div class="line"></div>
          <div class="item">
            <span>Subtotal:</span>
            <span>₱${data.subtotal.toFixed(2)}</span>
          </div>
          <div class="item">
            <span>Total:</span>
            <span>₱${data.total.toFixed(2)}</span>
          </div>
          <div class="item">
            <span>Amount Paid:</span>
            <span>₱${paidAmount.toFixed(2)}</span>
          </div>
          <div class="item total">
            <span>Change:</span>
            <span>₱${change.toFixed(2)}</span>
          </div>
          <div class="line"></div>
          <p style="text-align: center;">Thank you for your purchase!</p>
        </body>
      </html>`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Products Section */}
      <div className="lg:col-span-2 space-y-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-3xl font-bold tracking-tight mb-4">Products</h2>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <motion.div key={product.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card className="cursor-pointer" onClick={() => addToCart(product)}>
                  <CardHeader>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription>{product.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold">₱{product.price.toFixed(2)}</span>
                      <span className="text-sm text-muted-foreground">Stock: {product.stock}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Cart Section */}
      <div className="lg:col-span-1">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Cart ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-96 overflow-y-auto space-y-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center space-x-2 p-2 border rounded">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-sm text-muted-foreground">₱{item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="outline" size="icon" className="h-6 w-6"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-6 w-6"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6"
                        onClick={() => removeFromCart(item.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {cart.length > 0 ? (
                <>
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>₱{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>₱{total.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 space-y-2">
                      <label className="text-sm font-medium">Payment Method</label>
                      <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="gcash">GCash</SelectItem>
                        </SelectContent>
                      </Select>
                      {paymentMethod === 'cash' && (
                        <div className="flex justify-between items-center">
                          <span>Amount Paid:</span>
                          <Input
                            type="number"
                            value={amountPaid === '' ? '' : String(amountPaid)}
                            onChange={(e) => setAmountPaid(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-32 text-right"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    className="w-full mt-4"
                    onClick={() => {
                      const paid = paymentMethod === 'cash' ? Number(amountPaid) : total;
                      if (paymentMethod === 'cash' && (isNaN(paid) || paid < total)) {
                        toast.error('Amount paid must be equal or greater than total');
                        return;
                      }
                      handleCheckout(paid);
                    }}
                  >
                    Checkout
                  </Button>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">Cart is empty</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
            <DialogDescription>Review your transaction below.</DialogDescription>
          </DialogHeader>
          {receiptData && (
            <div className="space-y-4 py-2">
              <div className="text-sm">
                <div>Order ID: {receiptData.orderId.substring(0, 8)}</div>
                <div>Date: {new Date().toLocaleString()}</div>
                <div>Payment: {receiptData.paymentMethod.toUpperCase()}</div>
              </div>
              <div className="space-y-2">
                {receiptData.items.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <div className="text-sm">{item.name} x{item.quantity}</div>
                    <div className="text-sm">₱{(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₱{receiptData.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-bold">₱{receiptData.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span>₱{(amountPaid || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Change:</span>
                  <span className="font-medium">
                    ₱{(typeof amountPaid === 'number' ? Math.max(0, amountPaid - receiptData.total) : 0).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const html = generateReceiptHTML(receiptData, amountPaid === '' ? 0 : Number(amountPaid));
                    const blob = new Blob([html], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `receipt-${receiptData.orderId.substring(0,8)}.html`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download
                </Button>
                <Button
                  onClick={() => {
                    const html = generateReceiptHTML(receiptData, amountPaid === '' ? 0 : Number(amountPaid));
                    const w = window.open('', '_blank');
                    if (!w) return;
                    w.document.write(html);
                    w.document.close();
                    w.focus();
                    w.print();
                  }}
                >
                  Print
                </Button>
                <Button variant="outline" onClick={() => setReceiptOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
