import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useLocation } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { FilterProvider } from "@/contexts/FilterContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { detectDomain } from "@/lib/domainDetection";
import CustomerApp from "@/apps/CustomerApp";
import SellerApp from "@/apps/SellerApp";
import AdminApp from "@/apps/AdminApp";

const queryClient = new QueryClient();

const AppRouter = () => {
  const location = useLocation();
  const domain = detectDomain(location.pathname);
  switch (domain) {
    case 'seller':
      return <SellerApp />;
    case 'admin':
      return <AdminApp />;
    default:
      return <CustomerApp />;
  }
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <LocationProvider>
          <CartProvider>
            <FilterProvider>
              <WishlistProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <AppRouter />
                </BrowserRouter>
              </WishlistProvider>
            </FilterProvider>
          </CartProvider>
        </LocationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
