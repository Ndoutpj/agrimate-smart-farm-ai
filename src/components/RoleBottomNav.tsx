import { Link } from "@tanstack/react-router";
import { Home, Leaf, ShoppingCart, BarChart3, User, Search, Package, History, Wrench, Calendar, Wallet } from "lucide-react";
import type { AccountType } from "@/lib/profile";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string; icon: typeof Home };

const FARMER: Item[] = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/profile", label: "My Farm", icon: Leaf },
  { to: "/market", label: "Market", icon: ShoppingCart },
  { to: "/stats", label: "Stats", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: User },
];

const BUYER: Item[] = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/browse", label: "Browse", icon: Search },
  { to: "/orders", label: "Orders", icon: Package },
  { to: "/history", label: "History", icon: History },
  { to: "/profile", label: "Profile", icon: User },
];

const PROVIDER: Item[] = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/services", label: "Services", icon: Wrench },
  { to: "/bookings", label: "Bookings", icon: Calendar },
  { to: "/earnings", label: "Earnings", icon: Wallet },
  { to: "/profile", label: "Profile", icon: User },
];

export function RoleBottomNav({ accountType }: { accountType: AccountType }) {
  const items =
    accountType === "buyer" ? BUYER : accountType === "service_provider" ? PROVIDER : FARMER;

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-1">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <li key={it.label} className="flex-1">
              <Link
                to={it.to as never}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground",
                )}
                activeProps={{ className: "text-primary" }}
              >
                <Icon className="h-5 w-5" />
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
