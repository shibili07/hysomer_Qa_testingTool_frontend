import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/auth-context";
import { AuthWrapper } from "@/components/auth-wrapper";
import { SidebarLayout } from "@/components/sidebar-layout";
import { AppToaster } from "@/components/ui/toaster";
import ProductsPage from "@/pages/ProductsPage";
import InvoicePage from "@/pages/InvoicePage";
import CustomerPage from "@/pages/CustomersPage";
import LoginPage from "@/pages/LoginPage";

export default function App() {
  return (
    <AuthProvider>
      <AuthWrapper>
        <SidebarLayout>
          <main className="mx-auto max-w-6xl w-full p-4 md:p-6">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/invoice" element={<InvoicePage />} />
              <Route path="/customers" element={<CustomerPage />} />
              <Route path="/" element={<Navigate to="/products" replace />} />
              <Route path="*" element={<Navigate to="/products" replace />} />
            </Routes>
          </main>
          <AppToaster />
        </SidebarLayout>
      </AuthWrapper>
    </AuthProvider>
  );
}
