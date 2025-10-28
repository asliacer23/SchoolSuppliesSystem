import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

import Login from '@/pages/Login';
import Unauthorized from '@/pages/Unauthorized';
import Showcase from '@/pages/Showcase';
import AdminLayout from '@/pages/admin/AdminLayout';
import Dashboard from '@/pages/admin/Dashboard';
import Products from '@/pages/admin/Products';
import Reports from '@/pages/admin/Reports';
import Users from '@/pages/admin/Users';
import CashierLayout from '@/pages/cashier/CashierLayout';
import Order from '@/pages/cashier/Order';
import ResetPassword from '@/pages/cashier/ResetPassword'; // ✅ added here

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} /> {/* ✅ new route */}
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="products" element={<Products />} />
                <Route path="reports" element={<Reports />} />
              </Route>

              <Route
                path="/cashier"
                element={
                  <ProtectedRoute allowedRoles={['cashier']}>
                    <CashierLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Order />} />
              </Route>

              <Route path="/" element={<Showcase />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
