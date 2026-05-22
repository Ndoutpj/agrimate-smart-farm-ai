import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { FarmCalculator } from "@/components/FarmCalculator";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "Farm Calculator — AgriMate" },
      { name: "description", content: "Estimate seed, water, labour, and profit for any crop and field size." },
      { property: "og:title", content: "Farm Calculator — AgriMate" },
      { property: "og:description", content: "Smart planning calculator for African smallholders." },
    ],
  }),
  component: CalcPage,
});

function CalcPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 bg-[var(--gradient-soft)]" />
        <div className="absolute -top-24 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl animate-blob" />
        <div className="mx-auto max-w-5xl px-4 py-12 text-center animate-fade-up">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Farm <span className="text-primary">Calculator</span>
          </h1>
          <p className="mt-3 text-muted-foreground">Plan your inputs and profit in seconds.</p>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <FarmCalculator />
      </div>
    </div>
  );
}
