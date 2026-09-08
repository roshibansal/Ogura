import { Link, useLocation } from "react-router-dom";
import { DashboardHeader } from "@/components/seller-dashboard/DashboardHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useSellerStatus } from "@/hooks/useSellerStatus";
import { endDemo } from "@/lib/seller/demoSeller";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ShoppingCart,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SellerDashboardLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { label: "Dashboard", href: "/seller/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/seller/products", icon: Package },
  { label: "Add Product", href: "/seller/products/new", icon: PlusCircle },
  { label: "Orders", href: "/seller/orders", icon: ShoppingCart },
  { label: "Settings", href: "/seller/settings", icon: Settings },
];

export const SellerDashboardLayout = ({ children }: SellerDashboardLayoutProps) => {
  const { user, logout } = useAuth();
  const { identity, seller, isDemo } = useSellerStatus();
  const displayName = identity?.name ?? user?.name ?? "";
  const displayEmail = identity?.email ?? user?.email ?? "";
  const signOut = () => (isDemo ? endDemo() : logout());
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initials = displayName
    ? displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "S";

  const Sidebar = () => (
    <nav className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-6 border-b">
        <Link to="/seller/dashboard" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight">OGURA</span>
          <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {seller?.is_verified ? "Verified atelier" : "Atelier"}
          </span>
        </Link>
      </div>

      {/* Nav items */}
      <div className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
               className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground border-l-2 border-[#C9A56B]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* User section */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 border-r bg-gradient-to-b from-[#1A1A1A] to-[#141414] flex-col shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-background shadow-xl">
            <div className="absolute right-3 top-3">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm shadow-sm flex items-center lg:block">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden ml-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1 lg:flex-none">
            <DashboardHeader />
          </div>
        </div>

        <main className="flex-1 p-4 lg:p-8 bg-muted/40">{children}</main>
      </div>
    </div>
  );
};
