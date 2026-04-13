import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import Login from "@/pages/Login";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import MenuManagement from "@/pages/admin/MenuManagement";
import CategoryManagement from "@/pages/admin/CategoryManagement";
import TableManagement from "@/pages/admin/TableManagement";
import OrderOverview from "@/pages/admin/OrderOverview";
import StaffManagement from "@/pages/admin/StaffManagement";
import KitchenDashboard from "@/pages/kitchen/KitchenDashboard";
import StaffTables from "@/pages/staff/StaffTables";
import NewOrder from "@/pages/staff/NewOrder";
import TableOrders from "@/pages/staff/TableOrders";
import StaffOrders from "@/pages/staff/StaffOrders";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Login />;

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-4">
        <div>
          <h2 className="text-xl font-bold mb-2">No role assigned</h2>
          <p className="text-muted-foreground">Contact an admin to get a role assigned to your account.</p>
        </div>
      </div>
    );
  }

  const defaultRoute = role === 'admin' ? '/admin' : role === 'kitchen' ? '/kitchen' : '/staff';

  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Navigate to={defaultRoute} replace />} />
        {role === 'admin' && (
          <>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/menu" element={<MenuManagement />} />
            <Route path="/admin/categories" element={<CategoryManagement />} />
            <Route path="/admin/tables" element={<TableManagement />} />
            <Route path="/admin/orders" element={<OrderOverview />} />
            <Route path="/admin/staff" element={<StaffManagement />} />
          </>
        )}
        {role === 'kitchen' && (
          <Route path="/kitchen" element={<KitchenDashboard />} />
        )}
        {role === 'staff' && (
          <>
            <Route path="/staff" element={<StaffTables />} />
            <Route path="/staff/new-order/:tableId" element={<NewOrder />} />
            <Route path="/staff/table-orders/:tableId" element={<TableOrders />} />
            <Route path="/staff/orders" element={<StaffOrders />} />
          </>
        )}
        <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      </Routes>
    </DashboardLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
