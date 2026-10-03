import { Fragment } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  LogOut,
  User,
  Bell,
  ChevronDown,
  LayoutGrid,
  LayoutDashboard,
  CloudSun,
  Sprout,
  Search,
  ShoppingBag,
  Droplets,
  Store,
  CalendarDays,
  ClipboardList,
  Calculator,
  Bug,
  MessageCircle,
  BookOpen,
  HandCoins,
  BriefcaseBusiness,
  Wrench,
  Package,
  History,
  Lightbulb,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useProfile } from "@/lib/profile";
import { NotificationBell } from "./NotificationBell";

const PRIMARY_NAV = {
  farmer: [
    { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { to: "/my-farm", label: "My Farm", icon: Sprout },
    { to: "/weather", label: "Weather", icon: CloudSun },
  ],
  buyer: [
    { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { to: "/browse", label: "Browse", icon: Search },
    { to: "/orders", label: "Orders", icon: Package },
  ],
  service_provider: [
    { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { to: "/services", label: "Services", icon: Store },
    { to: "/bookings", label: "Bookings", icon: CalendarDays },
  ],
} as const;

const FEATURE_GROUPS = {
  farmer: [
    {
      label: "Manage your farm",
      links: [
        { to: "/tasks", label: "Daily tasks", icon: ClipboardList },
        { to: "/calculator", label: "Farm calculator", icon: Calculator },
        { to: "/crop-doctor", label: "Crop Doctor", icon: Bug },
      ],
    },
    {
      label: "Field guidance",
      links: [{ to: "/tips", label: "Farming tips", icon: Lightbulb }],
    },
    {
      label: "Funding",
      links: [{ to: "/grants", label: "Grants & subsidies", icon: HandCoins }],
    },
    {
      label: "Market & services",
      links: [
        { to: "/market", label: "Sell produce", icon: ShoppingBag },
        { to: "/equipment", label: "Equipment", icon: Wrench },
        { to: "/jobs", label: "Jobs board", icon: BriefcaseBusiness },
        { to: "/services", label: "My services", icon: Store },
      ],
    },
  ],
  buyer: [
    {
      label: "Shopping",
      links: [
        { to: "/history", label: "Order history", icon: History },
        { to: "/equipment", label: "Equipment", icon: Wrench },
        { to: "/jobs", label: "Jobs board", icon: BriefcaseBusiness },
        { to: "/weather", label: "Weather", icon: CloudSun },
      ],
    },
  ],
  service_provider: [
    {
      label: "Manage services",
      links: [
        { to: "/earnings", label: "Earnings", icon: HandCoins },
        { to: "/jobs", label: "Jobs board", icon: BriefcaseBusiness },
        { to: "/equipment", label: "Equipment", icon: Wrench },
      ],
    },
  ],
} as const;

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const accountType = profile?.account_type ?? "farmer";
  const primaryNav = PRIMARY_NAV[accountType];
  const featureGroups = FEATURE_GROUPS[accountType];

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/75 backdrop-blur supports-[backdrop-filter]:bg-background/55">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <Logo />
          <span className="text-lg font-semibold tracking-tight">
            Agri<span className="text-primary">Mate</span>
          </span>
        </Link>
        {user ? (
          <nav
            aria-label="Main navigation"
            className="hidden min-w-0 flex-1 items-center justify-center gap-1 text-sm text-muted-foreground lg:flex"
          >
            {primaryNav.map((n) => (
              <Link
                key={n.to}
                to={n.to as never}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 font-medium transition-colors hover:bg-muted/70 hover:text-foreground"
                activeProps={{ className: "bg-primary/10 text-primary" }}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 rounded-xl px-3 text-muted-foreground"
                >
                  <LayoutGrid className="h-4 w-4" /> More
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                className="max-h-[75vh] w-72 overflow-y-auto rounded-2xl p-2"
              >
                {featureGroups.map((group, index) => (
                  <Fragment key={group.label}>
                    {index > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuLabel className="px-3 pb-1 pt-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </DropdownMenuLabel>
                    {group.links.map((item) => (
                      <DropdownMenuItem
                        key={item.to}
                        onClick={() => navigate({ to: item.to as never })}
                        className="cursor-pointer rounded-xl px-3 py-2.5"
                      >
                        <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{item.label}</span>
                        <ChevronDown className="ml-auto h-3.5 w-3.5 -rotate-90 text-muted-foreground/60" />
                      </DropdownMenuItem>
                    ))}
                  </Fragment>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="px-3 pb-1 pt-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                  Account
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => navigate({ to: "/profile" })}
                  className="cursor-pointer rounded-xl px-3 py-2.5"
                >
                  <User className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer rounded-xl px-3 py-2.5 text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        ) : (
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-1 text-sm text-muted-foreground md:flex"
          >
            <a
              href="#features"
              className="rounded-full px-3 py-2 transition-colors hover:bg-muted/70 hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#calculator"
              className="rounded-full px-3 py-2 transition-colors hover:bg-muted/70 hover:text-foreground"
            >
              Farm calculator
            </a>
          </nav>
        )}
        <div className="flex shrink-0 items-center gap-2">
          {user && <NotificationBell />}
          {!user && (
            <>
              <Link to="/login" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/register" className="hidden sm:inline-flex">
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  Get started
                </Button>
              </Link>
            </>
          )}
          {user && (
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(22rem,90vw)] p-0">
                <div className="border-b border-border/70 bg-[var(--gradient-soft)] px-5 pb-5 pt-8">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <LayoutGrid className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold">AgriMate</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </div>
                <div className="max-h-[calc(100dvh-7rem)] overflow-y-auto px-4 pb-6">
                  <p className="px-2 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Your workspace
                  </p>
                  <div className="flex flex-col gap-1">
                    {primaryNav.map((n) => (
                      <Link
                        key={n.to}
                        to={n.to as never}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        activeProps={{ className: "bg-primary/10 text-primary" }}
                      >
                        <n.icon className="h-4 w-4" /> {n.label}
                      </Link>
                    ))}
                  </div>
                  {featureGroups.map((group) => (
                    <div key={group.label} className="mt-5">
                      <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {group.label}
                      </p>
                      <div className="flex flex-col gap-1">
                        {group.links.map((item) => (
                          <Link
                            key={item.to}
                            to={item.to as never}
                            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <item.icon className="h-4 w-4" /> {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="mt-5 border-t border-border pt-4">
                    <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Account
                    </p>
                    <div className="flex flex-col gap-1">
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <User className="h-4 w-4" /> Profile
                      </Link>
                      <Link
                        to="/notifications"
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Bell className="h-4 w-4" /> Notifications
                      </Link>
                    </div>
                    <Button
                      variant="outline"
                      className="mt-3 w-full justify-start"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
          {!user && (
            <div className="flex items-center gap-1 md:hidden">
              <Link to="/register">
                <Button size="sm">Get started</Button>
              </Link>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <nav aria-label="Main navigation" className="mt-8 flex flex-col gap-1">
                    <a
                      href="#features"
                      className="rounded-xl px-3 py-3 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      Explore features
                    </a>
                    <a
                      href="#calculator"
                      className="rounded-xl px-3 py-3 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      Try the farm calculator
                    </a>
                    <Link
                      to="/login"
                      className="rounded-xl px-3 py-3 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      Sign in
                    </Link>
                    <Link to="/register" className="mt-2 px-3">
                      <Button className="w-full">Create your free account</Button>
                    </Link>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
