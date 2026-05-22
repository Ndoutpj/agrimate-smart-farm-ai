import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/crop-doctor", label: "Crop Doctor" },
  { to: "/qa", label: "Q&A" },
  { to: "/tips", label: "Tips" },
  { to: "/calculator", label: "Calculator" },
] as const;

export function SiteHeader() {
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
          <Link to="/login" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link to="/register" className="hidden sm:inline-flex">
            <Button size="sm" className="bg-primary hover:bg-primary/90">Get started</Button>
          </Link>
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
                <div className="mt-4 grid gap-2">
                  <Link to="/login"><Button variant="outline" className="w-full">Sign in</Button></Link>
                  <Link to="/register"><Button className="w-full">Get started</Button></Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
