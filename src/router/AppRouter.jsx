import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../store/AuthContext';
import ProtectedRoute from './ProtectedRoute';

import AppLayout from '../components/layout/AppLayout';
import AIInsights from '../pages/AIInsights';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Customers from '../pages/Customers';
import Dashboard from '../pages/Dashboard';
import Expenses from '../pages/Expenses';
import Invoices from '../pages/Invoices';
import Products from '../pages/Products';
import Reports from '../pages/Reports';
import Sales from '../pages/Sales';
import Settings from '../pages/Settings';
import Suppliers from '../pages/Suppliers';

export default function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/products" element={<Products />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/ai-insights" element={<AIInsights />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
