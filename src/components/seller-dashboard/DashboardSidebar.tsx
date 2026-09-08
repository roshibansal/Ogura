import { useState } from "react";
import {
  Home,
  ShoppingCart,
  Package,
  FolderOpen,
  Warehouse,
  ClipboardList,
  ArrowLeftRight,
  Gift,
  Users,
  Megaphone,
  Percent,
  FileText,
  Globe,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  children?: { id: string; label: string }[];
}

const menuItems: MenuItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  {
    id: "products",
    label: "Products",
    icon: Package,
    children: [
      { id: "collections", label: "Collections" },
      { id: "inventory", label: "Inventory" },
      { id: "purchase-orders", label: "Purchase orders" },
      { id: "transfers", label: "Transfers" },
      { id: "gift-cards", label: "Gift cards" },
    ],
  },
  { id: "customers", label: "Customers", icon: Users },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "discounts", label: "Discounts", icon: Percent },
  { id: "content", label: "Content", icon: FileText },
  { id: "markets", label: "Markets", icon: Globe },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export const DashboardSidebar = ({ activeTab, setActiveTab }: DashboardSidebarProps) => {
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["products"]);

  const toggleExpand = (id: string) => {
    setExpandedMenus((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const isActive = (id: string) => activeTab === id;
  const isChildActive = (item: MenuItem) =>
    item.children?.some((c) => activeTab === c.id) ?? false;

  return (
    <aside className="w-[220px] bg-gradient-to-b from-[#1A1A1A] via-[#1F1F1F] to-[#141414] text-[#E3E5E7] flex flex-col shrink-0 overflow-y-auto">
      {/* Store name */}
      <div className="px-5 py-5 border-b border-white/10">
        <span className="text-sm font-bold tracking-widest uppercase text-[#C9A56B]">Ogura Store</span>
      </div>

      <nav className="flex-1 py-2 px-2 space-y-0.5">
        {menuItems.map((item) => {
          const hasChildren = !!item.children;
          const expanded = expandedMenus.includes(item.id);
          const active = isActive(item.id) || isChildActive(item);

          return (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (hasChildren) {
                    toggleExpand(item.id);
                    if (!isChildActive(item)) setActiveTab(item.id);
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200",
                  active
                    ? "bg-white/15 text-white border-l-2 border-[#C9A56B] pl-2"
                    : "text-[#B5B5B5] hover:bg-white/8 hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {hasChildren &&
                  (expanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  ))}
              </button>

              {hasChildren && expanded && (
                <div className="ml-7 mt-0.5 space-y-0.5">
                  {item.children!.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => setActiveTab(child.id)}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded-md text-[13px] transition-all duration-200",
                        isActive(child.id)
                          ? "bg-white/15 text-white font-medium border-l-2 border-[#C9A56B] pl-2"
                          : "text-[#B5B5B5] hover:bg-white/8 hover:text-white"
                      )}
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};
