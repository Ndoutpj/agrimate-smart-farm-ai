import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { FarmCalculator } from "@/components/FarmCalculator";
import { Logo } from "@/components/Logo";
import { Tilt3D } from "@/components/Tilt3D";
import { Button } from "@/components/ui/button";
import {
  Sprout,
  ScanLine,
  CloudSun,
  BookOpen,
  Users,
  BellRing,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Check,
} from "lucide-react";
import heroImg from "@/assets/hero-farm.jpg";
import featureAi from "@/assets/feature-ai.jpg";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "AgriMate — Smart farming, planning & AI crop care" },
      {
        name: "description",
        content:
          "AgriMate helps farmers plan crops, calculate budgets, diagnose disease with AI, and stay ahead of the weather — all in one beautiful app.",
      },
      { property: "og:title", content: "AgriMate — Smart farming for modern growers" },
      {
        property: "og:description",
        content:
          "Plan crops, calculate budgets, diagnose disease with AI, and stay ahead of the weather.",
      },
    ],
  }),
});

const features = [
  {
    icon: Sprout,
    title: "Farm Planning Calculator",
    desc: "Seed, water, labor, fertilizer & budget estimates tuned to your crop, soil and irrigation.",
    to: "/calculator",
  },
  {
    icon: ScanLine,
    title: "AI Crop Doctor",
    desc: "Snap a photo and get instant diagnosis with organic and chemical treatment options.",
    to: "/crop-doctor",
  },
  {
    icon: CloudSun,
    title: "Weather Intelligence",
    desc: "7-day forecasts, rain probability and smart farming alerts for your region.",
    to: "/weather",
  },
  {
    icon: BookOpen,
    title: "Knowledge Hub",
    desc: "Guides for beginner to pro farmers — soil, irrigation, pests and harvesting.",
    to: "/tips",
  },
  {
    icon: Users,
    title: "Farmer Community",
    desc: "Ask questions, share photos, learn from growers cultivating the same crops as you.",
    to: "/qa",
  },
  {
    icon: BellRing,
    title: "Smart Reminders",
    desc: "Never miss irrigation, fertilizing or harvest windows with proactive notifications.",
    to: "/tasks",
  },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-70"
          style={{ background: "var(--gradient-soft)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -left-32 -z-10 h-[520px] w-[520px] rounded-full blur-3xl opacity-60 animate-blob"
          style={{ background: "color-mix(in oklab, var(--primary-glow) 45%, transparent)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-20 -right-32 -z-10 h-[420px] w-[420px] rounded-full blur-3xl opacity-50 animate-blob"
          style={{
            background: "color-mix(in oklab, var(--earth) 35%, transparent)",
            animationDelay: "-6s",
          }}
        />

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:pt-24 lg:grid-cols-2">
          <div className="animate-fade-up">
            <div className="mb-5 flex items-center gap-3">
              <Logo className="h-11 w-11" />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" /> AI-powered farming
              </span>
            </div>
            <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Grow smarter with{" "}
              <span className="bg-gradient-to-br from-primary to-primary-glow bg-clip-text text-transparent">
                AgriMate
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-pretty text-lg text-muted-foreground">
              Plan crops, calculate every input, diagnose disease from a photo, and stay ahead of
              the weather — built for African farmers, from first hectare to scale.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/register">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 shadow-[var(--shadow-glow)]"
                >
                  Start free <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
              <a href="#calculator">
                <Button size="lg" variant="outline">
                  Try the calculator
                </Button>
              </a>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Secure cloud backend
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-primary" /> Practical tools for every season
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-primary" /> Built around real farm workflows
              </span>
            </div>
          </div>

          {/* 3D hero card stack */}
          <div className="relative h-[420px] sm:h-[480px] perspective-1000">
            <Tilt3D max={12} className="relative h-full w-full">
              <div className="relative h-full w-full rounded-3xl overflow-hidden ring-1 ring-border shadow-[var(--shadow-lg)]">
                <img src={heroImg} alt="Sunlit farmland" className="h-full w-full object-cover" />
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent 50%, color-mix(in oklab, var(--primary) 30%, transparent))",
                  }}
                />
              </div>

              {/* floating stat card */}
              <div
                className="absolute -left-2 bottom-8 w-56 animate-float rounded-2xl border border-border/70 bg-card/95 p-4 shadow-[var(--shadow-md)] backdrop-blur sm:-left-6"
                style={{ transform: "translateZ(60px)" }}
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sprout className="h-3.5 w-3.5 text-primary" /> Crop planning
                </div>
                <div className="mt-1 text-lg font-semibold">Plan with confidence</div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  Inputs, timing &amp; budget
                </div>
              </div>

              {/* floating weather card */}
              <div
                className="absolute -right-2 top-6 w-52 animate-float rounded-2xl border border-border/70 bg-card/95 p-4 shadow-[var(--shadow-md)] backdrop-blur sm:-right-4"
                style={{ transform: "translateZ(80px)", animationDelay: "-2s" }}
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CloudSun className="h-3.5 w-3.5 text-earth" /> Weather tools
                </div>
                <div className="mt-1 text-lg font-semibold">Stay a step ahead</div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  Forecasts &amp; local alerts
                </div>
              </div>
            </Tilt3D>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight">
            Everything a modern farmer needs
          </h2>
          <p className="mt-2 text-muted-foreground">
            One ecosystem for planning, diagnosis, weather, learning and community — designed to
            feel as calm as the morning fields.
          </p>
        </div>
        <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Plan", value: "Crop budgets & inputs" },
            { label: "Protect", value: "AI crop guidance" },
            { label: "Prepare", value: "Weather intelligence" },
            { label: "Learn", value: "Practical farm guides" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/30"
            >
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                {item.label}
              </div>
              <div className="mt-2 text-sm font-medium text-foreground">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Tilt3D key={f.title} max={6}>
              <Link
                to={f.to}
                className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
              >
                <div className="h-full rounded-2xl border border-border/70 bg-card p-6 transition-all group-hover:-translate-y-1 group-hover:border-primary/30 group-hover:shadow-[var(--shadow-md)]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Explore feature{" "}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </Tilt3D>
          ))}
        </div>

        <div className="mt-16 grid gap-4 lg:grid-cols-3">
          {[
            {
              title: "Plan smarter",
              body: "Build crop calendars, calculate inputs, and track costs before you spend a single rand.",
              accent: "bg-primary/10 text-primary",
            },
            {
              title: "Prevent problems",
              body: "Catch pests, diseases, and stress early with photo checks and weather-driven alerts.",
              accent: "bg-earth/15 text-earth",
            },
            {
              title: "Grow more profitably",
              body: "Use better irrigation timing, training, and market data to improve resilience and returns.",
              accent: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
            },
          ].map((pack) => (
            <div key={pack.title} className="rounded-2xl border border-border/70 bg-card p-6">
              <div
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${pack.accent}`}
              >
                {pack.title}
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{pack.body}</p>
            </div>
          ))}
        </div>

        {/* AI Crop Doctor showcase */}
        <div className="mt-16 grid items-center gap-10 rounded-3xl border border-border/70 bg-card p-8 sm:p-12 lg:grid-cols-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              AI Crop Doctor
            </span>
            <h3 className="mt-2 text-3xl font-semibold tracking-tight">
              Diagnose disease from a single photo
            </h3>
            <p className="mt-3 text-muted-foreground">
              Snap a leaf. AgriMate detects diseases, deficiencies and pests — then recommends
              organic and chemical treatments with confidence scores and severity.
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              {[
                "Instant diagnosis with confidence score",
                "Organic + chemical treatment options",
                "Severity & prevention tips",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <Tilt3D max={10}>
            <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-[var(--gradient-soft)] ring-1 ring-border shadow-[var(--shadow-md)]">
              <img
                src={featureAi}
                alt="AI scanning a crop"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </Tilt3D>
        </div>
      </section>

      {/* Calculator */}
      <section id="calculator" className="border-y border-border/60 bg-[var(--gradient-soft)]/60">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Live tool
              </span>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight">
                Farm Planning Calculator
              </h2>
              <p className="mt-1 max-w-xl text-muted-foreground">
                Adjust your crop, soil and irrigation — AgriMate instantly recalculates inputs,
                budget and yield.
              </p>
            </div>
          </div>
          <FarmCalculator />
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Logo className="h-7 w-7" />
            <span>
              © {new Date().getFullYear()} AgriMate · A product of Poklon Group (Pty) Ltd.
            </span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#calculator" className="hover:text-foreground">
              Calculator
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
