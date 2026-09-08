import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, LogOut, LayoutDashboard, User, ShoppingCart, Package, AlertTriangle, CheckCircle, XCircle, BadgeCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { useSellerStatus } from "@/hooks/useSellerStatus";
import { endDemo } from "@/lib/seller/demoSeller";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  icon: React.ElementType;
  iconColor: string;
}

const mockNotifications: Notification[] = [
  { id: "1", title: "New order received", description: "Order #1042 from customer", time: "2 min ago", read: false, icon: ShoppingCart, iconColor: "text-primary" },
  { id: "2", title: "Product approved", description: "Silk Saree has been approved", time: "1 hour ago", read: false, icon: CheckCircle, iconColor: "text-green-600" },
  { id: "3", title: "Product rejected", description: "Cotton Kurta needs changes", time: "3 hours ago", read: false, icon: XCircle, iconColor: "text-destructive" },
  { id: "4", title: "Low inventory warning", description: "Embroidered Lehenga — 2 left", time: "5 hours ago", read: true, icon: AlertTriangle, iconColor: "text-yellow-600" },
];

export const DashboardHeader = () => {
  const { user, logout } = useAuth();
  const { identity, seller, isDemo } = useSellerStatus();
  const navigate = useNavigate();
  // A demo walkthrough is a signed-in seller as far as this chrome is concerned.
  const isAuthenticated = !!identity;
  const displayName = identity?.name ?? user?.name ?? "";
  const displayEmail = identity?.email ?? user?.email ?? "";
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const initials = displayName
    ? displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "S";

  const handleLogout = async () => {
    if (isDemo) {
      endDemo();
    } else {
      await logout();
    }
    navigate("/sell");
  };

  return (
    <header className="h-16 bg-background/95 backdrop-blur-sm border-b shadow-sm flex items-center px-6 gap-4 shrink-0">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products, orders, customers..." className="pl-9 h-9 bg-muted/50 border border-border/50 focus:border-primary/30 text-sm transition-colors duration-200" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        {isAuthenticated ? (
          <Popover>
            <PopoverTrigger asChild>
              <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                <Bell className="h-4 w-4 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <p className="text-sm font-semibold">Notifications</p>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className={cn("flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-0", !n.read && "bg-primary/5")}>
                    <n.icon className={cn("h-4 w-4 mt-0.5 shrink-0", n.iconColor)} />
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm", !n.read && "font-medium")}>{n.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{n.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                    </div>
                    {!n.read && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <button className="relative p-2 rounded-lg opacity-40 cursor-not-allowed" disabled>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        {seller?.is_verified && (
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#0C7A54]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#0C7A54]">
            <BadgeCheck className="h-3 w-3" /> Verified
          </span>
        )}
        {isDemo && (
          <span className="hidden sm:inline-flex items-center rounded-full border border-[#5A0A26]/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#5A0A26]/70">
            Demo account
          </span>
        )}

        {/* Auth area */}
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarImage src={user?.avatarUrl} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="px-2 py-2 border-b mb-1">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
                {seller?.is_verified && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#0C7A54]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0C7A54]">
                    <BadgeCheck className="h-3 w-3" /> Verified atelier
                  </span>
                )}
              </div>
              <DropdownMenuItem onClick={() => navigate("/seller/settings")} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/seller/dashboard")} className="cursor-pointer">
                <LayoutDashboard className="mr-2 h-4 w-4" /> Seller Dashboard
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button size="sm" onClick={() => navigate("/sell")}>
            Sign in
          </Button>
        )}
      </div>
    </header>
  );
};
