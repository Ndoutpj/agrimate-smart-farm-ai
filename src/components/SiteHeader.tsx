import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, LogOut, User, ListChecks, LayoutDashboard, Sparkles, Crown } from "lucide-react";
import { useAuth, initials } from "@/lib/auth";
import { usePremium } from "@/lib/premium";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/weather", label: "Weather" },
  { to: "/crop-doctor", label: "Crop Doctor" },
  { to: "/qa", label: "Q&A" },
  { to: "/tips", label: "Tips" },
  { to: "/calculator", label: "Calculator" },
] as const;

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const { isPremium } = usePremium();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/75 backdrop-blur supports-[backdrop-filter]:bg-background/55">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo />
          <span className="text-lg font-semibold tracking-tight">
            Agri<span className="text-primary">Mate</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-muted-foreground lg:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="transition-colors hover:text-foreground" activeProps={{ className: "text-foreground font-medium" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user && !isPremium && (
            <Link to="/upgrade" className="hidden sm:inline-flex">
              <Button size="sm" variant="outline" className="border-amber-400/50 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Upgrade
              </Button>
            </Link>
          )}
          {user && isPremium && (
            <span className="hidden items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm sm:inline-flex">
              <Crown className="h-3 w-3" /> Premium
            </span>
          )}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-sm font-semibold text-primary-foreground shadow-sm transition hover:scale-105">
                  {initials(user.user_metadata?.full_name as string | undefined, user.email)}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                  <User className="mr-2 h-4 w-4" /> My Farm
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/tasks" })}>
                  <ListChecks className="mr-2 h-4 w-4" /> Tasks
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link to="/register" className="hidden sm:inline-flex">
                <Button size="sm" className="bg-primary hover:bg-primary/90">Get started</Button>
              </Link>
            </>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="mt-8 flex flex-col gap-1">
                {NAV.map((n) => (
                  <Link key={n.to} to={n.to} className="rounded-lg px-3 py-2 text-sm hover:bg-muted">{n.label}</Link>
                ))}
                {user ? (
                  <>
                    <Link to="/profile" className="rounded-lg px-3 py-2 text-sm hover:bg-muted">My Farm</Link>
                    <Link to="/tasks" className="rounded-lg px-3 py-2 text-sm hover:bg-muted">Tasks</Link>
                    <Button variant="outline" className="mt-3 w-full" onClick={handleSignOut}>Sign out</Button>
                  </>
                ) : (
                  <div className="mt-4 grid gap-2">
                    <Link to="/login"><Button variant="outline" className="w-full">Sign in</Button></Link>
                    <Link to="/register"><Button className="w-full">Get started</Button></Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
