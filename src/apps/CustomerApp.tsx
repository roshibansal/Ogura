import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LocationPermissionModal } from "@/components/LocationPermissionModal";
import { ManualLocationSelector } from "@/components/ManualLocationSelector";
import Index from "@/pages/Index";
import Collections from "@/pages/Collections";
import CollectionDetail from "@/pages/CollectionDetail";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import OrderConfirmation from "@/pages/OrderConfirmation";
import Brands from "@/pages/Brands";
import BrandDetail from "@/pages/BrandDetail";
import BrandStore from "@/pages/BrandStore";
import Designers from "@/pages/Designers";
import DesignerDetail from "@/pages/DesignerDetail";
import DesignerProfilePage from "@/pages/DesignerProfilePage";
import HowItWorks from "@/pages/HowItWorks";
import Occasions from "@/pages/Occasions";
import OccasionDetail from "@/pages/OccasionDetail";
import Stores from "@/pages/Stores";
import Wishlist from "@/pages/Wishlist";
import Search from "@/pages/Search";
import NotFound from "@/pages/NotFound";
import CategoryPage from "@/pages/CategoryPage";
import JoinUs from "@/pages/JoinUs";
import Login from "@/pages/Login";
import SellerApply from "@/pages/SellerApply";
import Dashboard from "@/pages/Dashboard";
import Onboarding from "@/pages/Onboarding";
import Profile from "@/pages/Profile";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfUse from "@/pages/TermsOfUse";
import PinterestCallback from "@/pages/PinterestCallback";
import Contact from "@/pages/Contact";
import Careers from "@/pages/Careers";
import OAuthConsent from "@/pages/OAuthConsent";
import BrandWaitlist from "@/pages/BrandWaitlist";
import { PushNotificationManager } from "@/components/notifications/PushNotificationManager";


const CustomerApp = () => {
  return (
    <>
      <PushNotificationManager />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/collections/:category" element={<Collections />} />
        <Route path="/designs" element={<Collections />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/boutiques" element={<Designers />} />
        <Route path="/boutiques/:designerId" element={<DesignerDetail />} />
        <Route path="/collection/:slug" element={<CollectionDetail />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/brands" element={<Brands />} />
        <Route path="/store/:slug" element={<BrandStore />} />
        <Route path="/brand/:slug" element={<BrandStore />} />
        <Route path="/brands/:brandId" element={<BrandDetail />} />
        <Route path="/designers" element={<Designers />} />
        <Route path="/designers/:designerId" element={<DesignerDetail />} />
        <Route path="/designer/:slug" element={<DesignerProfilePage />} />
        <Route path="/occasions" element={<Occasions />} />
        <Route path="/occasions/:occasionId" element={<OccasionDetail />} />
        <Route path="/stores" element={<Stores />} />
        <Route path="/search" element={<Search />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/join" element={<JoinUs />} />
        <Route path="/join/apply" element={<SellerApply />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/seller-program" element={<BrandWaitlist />} />
        <Route path="/waitlist" element={<Navigate to="/seller-program" replace />} />
        <Route path="/apply-to-join" element={<Navigate to="/seller-program" replace />} />

        <Route path="/auth/pinterest/callback" element={<PinterestCallback />} />
        <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />

        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<Wishlist />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/order-confirmation" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />


        <Route path="*" element={<NotFound />} />
      </Routes>
      <LocationPermissionModal />
      <ManualLocationSelector />
    </>
  );
};

export default CustomerApp;
