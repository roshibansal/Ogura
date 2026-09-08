import { Routes, Route, Navigate } from "react-router-dom";
import { SellerPublicLayout } from "@/layouts/SellerPublicLayout";
import { SellerDashboardLayout } from "@/layouts/SellerDashboardLayout";
import { SellerAuthRoute } from "@/components/auth/SellerAuthRoute";
import SellerLanding from "@/pages/seller/SellerLanding";
import SellerGateway from "@/pages/seller/SellerGateway";
import JoinUs from "@/pages/JoinUs";
import SellerDashboardHome from "@/pages/seller/SellerDashboardHome";
import SellerProducts from "@/pages/seller/SellerProducts";
import SellerAddProduct from "@/pages/seller/SellerAddProduct";
import SellerOrders from "@/pages/seller/SellerOrders";
import SellerSettings from "@/pages/seller/SellerSettings";

const WrappedRoute = ({ children }: { children: React.ReactNode }) => (
  <SellerAuthRoute>
    <SellerDashboardLayout>{children}</SellerDashboardLayout>
  </SellerAuthRoute>
);

const SellerApp = () => {
  return (
    <Routes>
      <Route path="/join" element={<JoinUs />} />
      <Route path="/sell" element={<SellerGateway />} />
      <Route path="/seller" element={<Navigate to="/sell" replace />} />
      <Route path="/seller/join" element={<Navigate to="/sell" replace />} />
      <Route path="/seller-login" element={<Navigate to="/sell" replace />} />
      <Route path="/seller-signup" element={<Navigate to="/sell" replace />} />
      <Route path="/seller/login" element={<Navigate to="/sell" replace />} />
      <Route path="/seller/dashboard" element={<WrappedRoute><SellerDashboardHome /></WrappedRoute>} />
      <Route path="/seller/products" element={<WrappedRoute><SellerProducts /></WrappedRoute>} />
      <Route path="/seller/products/new" element={<WrappedRoute><SellerAddProduct /></WrappedRoute>} />
      <Route path="/seller/orders" element={<WrappedRoute><SellerOrders /></WrappedRoute>} />
      <Route path="/seller/settings" element={<WrappedRoute><SellerSettings /></WrappedRoute>} />
      <Route path="/seller/*" element={<Navigate to="/sell" replace />} />
    </Routes>
  );
};

export default SellerApp;
