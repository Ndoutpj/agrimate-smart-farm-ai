import { Link } from "@tanstack/react-router";
import {
  Home,
  Leaf,
  ShoppingCart,
  User,
  Search,
  Package,
  History,
  Wrench,
  Calendar,
  Wallet,
  ClipboardList,
} from "lucide-react";
import type { AccountType } from "@/lib/profile";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string; icon: typeof Home };

const FARMER: Item[] = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/my-farm", label: "My Farm", icon: Leaf },
  { to: "/market", label: "Market", icon: ShoppingCart },
  { to: "/tasks", label: "Tasks", icon: ClipboardList },
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
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/70 bg-background/95 shadow-[0_-8px_24px_-20px_rgba(0,0,0,0.35)] backdrop-blur supports-[backdrop-filter]:bg-background/85 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between gap-1 px-2 pt-1">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <li key={it.label} className="flex-1">
              <Link
                to={it.to as never}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground sm:text-[11px]",
                )}
                activeProps={{ className: "bg-primary/10 text-primary" }}
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
