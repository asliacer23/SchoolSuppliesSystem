import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Package, FileText, LogOut, Menu, X, ShoppingBag } from 'lucide-react';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  // Ensure sidebar is open on large screens so navigation is visible on desktop
  useEffect(() => {
    const updateSidebar = () => setSidebarOpen(window.innerWidth >= 1024);
    // Initialize based on current width
    updateSidebar();
    window.addEventListener('resize', updateSidebar);
    return () => window.removeEventListener('resize', updateSidebar);
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Reports', href: '/admin/reports', icon: FileText },
  
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShoppingBag className="h-6 w-6" />
          <span className="font-bold">Admin Panel</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : '-100%' }}
        className="lg:translate-x-0 fixed inset-y-0 left-0 z-40 w-64 bg-card border-r transition-transform lg:block"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b px-6">
            <ShoppingBag className="h-6 w-6 mr-2" />
            <span className="text-lg font-bold">Admin Panel</span>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                  className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t p-4 space-y-2 lg:hidden">
            <ThemeToggle />
            <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className={`transition-all ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-0'}`}>
        <main className="p-6 pt-20 lg:pt-6">
          {/* Desktop header with actions */}
          <div className="hidden lg:flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle navigation"
              >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
              <span className="text-lg font-semibold">Admin Panel</span>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut className="mr-2 h-5 w-5" />
                Sign Out
              </Button>
            </div>
          </div>

          <Outlet />
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
