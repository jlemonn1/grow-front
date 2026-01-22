import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/onboarding/OnboardingPage';
import { HomePage } from './pages/HomePage';
import { SaleCreatePage } from './pages/sales/SaleCreatePage';
import { SalesPage } from './pages/sales/SalesPage';
import { SaleDetailPage } from './pages/sales/SaleDetailPage';
import { ProductsPage } from './pages/products/ProductsPage';
import { ProductCreatePage } from './pages/products/ProductCreatePage';
import { ProductDetailPage } from './pages/products/ProductDetailPage';
import { CustomersPage } from './pages/customers/CustomersPage';
import { CustomerCreatePage } from './pages/customers/CustomerCreatePage';
import { CustomerDetailPage } from './pages/customers/CustomerDetailPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { ConfigPage } from './pages/config/ConfigPage';
import { AdminsPage } from './pages/admins/AdminsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { OnboardingRoute } from './components/common/OnboardingRoute';

export function AppRoutes() {
  return (
    <Routes>
      {/* Ruta pública de login */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Ruta de onboarding - protegida pero diferente del layout normal */}
      <Route
        path="/onboarding"
        element={
          <OnboardingRoute>
            <OnboardingPage />
          </OnboardingRoute>
        }
      />
      
      {/* Rutas protegidas dentro del layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Ruta raíz redirige a la página home */}
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<HomePage />} />
        <Route path="sales/new" element={<SaleCreatePage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="sales/:id" element={<SaleDetailPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<ProductCreatePage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/new" element={<CustomerCreatePage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="config" element={<ConfigPage />} />
        <Route path="admins" element={<AdminsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
