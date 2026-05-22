import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Check } from "lucide-react";
import sideImage from "@/assets/auth-side.jpg";

interface Field { name: string; label: string; type?: string; placeholder?: string }

export function AuthShell({
  title, subtitle, fields, submitLabel, footer, perks,
}: {
  title: string;
  subtitle: string;
  fields: Field[];
  submitLabel: string;
  footer: ReactNode;
  perks: string[];
}) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // UI-only auth for now; backend hook-up next.
    setTimeout(() => {
      setLoading(false);
      navigate({ to: "/" });
    }, 700);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: form */}
      <div className="relative flex items-center justify-center px-6 py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl opacity-50 animate-blob"
          style={{ background: "color-mix(in oklab, var(--primary-glow) 40%, transparent)" }}
        />
        <div className="w-full max-w-md animate-fade-up">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <Logo />
            <span className="text-lg font-semibold tracking-tight">
              Agri<span className="text-primary">Mate</span>
            </span>
          </Link>

          <h1 className="mt-8 text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {fields.map((f) => (
              <div key={f.name} className="space-y-1.5">
                <Label htmlFor={f.name}>{f.label}</Label>
                <Input
                  id={f.name}
                  name={f.name}
                  type={f.type ?? "text"}
                  placeholder={f.placeholder}
                  required
                  autoComplete={f.type === "password" ? "current-password" : "on"}
                />
              </div>
            ))}

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 shadow-[var(--shadow-glow)]"
            >
              {loading ? "Please wait…" : submitLabel}
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Button type="button" variant="outline" size="lg" className="w-full">
              Continue with Google
            </Button>
          </form>

          <div className="mt-6 text-sm text-muted-foreground">{footer}</div>
        </div>
      </div>

      {/* Right: visual */}
      <div className="relative hidden lg:block overflow-hidden">
        <img
          src={sideImage}
          alt="Seedling at sunrise"
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, color-mix(in oklab, var(--primary) 55%, transparent), transparent 60%)" }}
        />
        <div className="relative z-10 flex h-full flex-col justify-end p-12 text-primary-foreground">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> AgriMate Premium
          </span>
          <h2 className="mt-4 max-w-md text-3xl font-semibold leading-tight">
            Grow more. Waste less. Decide with data.
          </h2>
          <ul className="mt-6 space-y-2 text-sm/relaxed">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                  <Check className="h-3 w-3" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
