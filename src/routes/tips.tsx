import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sprout, Droplets, Sun, Bug, TrendingUp, Tractor, Leaf, CloudRain, Wheat, Recycle } from "lucide-react";

export const Route = createFileRoute("/tips")({
  head: () => ({
    meta: [
      { title: "Farming Tips & Best Practices — AgriMate" },
      { name: "description", content: "Practical, science-backed farming tips for African smallholders — soil, water, pests, harvest and market." },
      { property: "og:title", content: "Farming Tips & Best Practices — AgriMate" },
      { property: "og:description", content: "Smarter farming in bite-size, actionable tips." },
    ],
  }),
  component: TipsPage,
});

const TIPS = [
  { icon: Sprout, cat: "Soil", title: "Test before you plant", body: "A simple R150 soil test reveals pH and nutrient gaps. Apply lime 8 weeks before sowing if pH < 5.5." },
  { icon: Droplets, cat: "Water", title: "Irrigate at dawn", body: "Watering between 4–8 AM cuts evaporation loss by up to 30% and reduces fungal pressure." },
  { icon: Bug, cat: "Pests", title: "Scout twice a week", body: "Walk a W-pattern across the field. Catching aphid colonies early saves 60% of spray cost." },
  { icon: Sun, cat: "Climate", title: "Mulch to cool roots", body: "A 5 cm straw mulch keeps soil 4–6 °C cooler and locks in moisture during heat waves." },
  { icon: Leaf, cat: "Crop", title: "Rotate legumes in", body: "Following maize with cowpea or soybean adds up to 80 kg N/ha for free." },
  { icon: CloudRain, cat: "Weather", title: "Trust the 7-day forecast", body: "Delay top-dressing nitrogen if heavy rain is forecast in 48h — you'll lose it to leaching." },
  { icon: Wheat, cat: "Harvest", title: "Test grain moisture", body: "Maize stores safely at ≤13.5% moisture. Above 15% it heats and moulds within weeks." },
  { icon: TrendingUp, cat: "Market", title: "Sell in batches", body: "Splitting your harvest into 3 sales over 6 weeks usually beats a single-day price by 8–15%." },
  { icon: Tractor, cat: "Equipment", title: "Calibrate your sprayer", body: "Re-check nozzle output every 20 hectares. Worn tips waste up to 25% of chemical." },
  { icon: Recycle, cat: "Sustainability", title: "Compost crop residue", body: "Turning stover into compost returns 1.2% organic matter to soil per cycle — gold over 3 seasons." },
];

const GUIDES = [
  { title: "Tomato season checklist", steps: ["Stake at week 3", "Side-dress K at flowering", "Mulch heavily", "Scout for early blight weekly"] },
  { title: "Maize fertilizer schedule", steps: ["Basal NPK at planting", "Top-dress N at V6", "Second N at V10", "Skip if rain forecast"] },
  { title: "Starting a 1-ha vegetable plot", steps: ["Soil test → lime", "Drip lines + mulch", "Stagger plantings every 2 weeks", "Build a simple shade-net nursery"] },
];

export default undefined;

function TipsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 bg-[var(--gradient-soft)]" />
        <div className="absolute -top-20 right-1/3 -z-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl animate-blob" />
        <div className="mx-auto max-w-5xl px-4 py-12 text-center animate-fade-up">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Farming <span className="text-primary">Tips</span> & Best Practices
          </h1>
          <p className="mt-3 text-muted-foreground">Bite-size knowledge from agronomists, validated in the field.</p>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-xl font-semibold">Quick wins</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TIPS.map(({ icon: Icon, ...t }, i) => (
            <Card
              key={t.title}
              className="tilt-card group relative overflow-hidden p-5 animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition group-hover:bg-primary/20" />
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <Badge variant="secondary" className="mb-1">{t.cat}</Badge>
                  <h3 className="font-semibold">{t.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t.body}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="mb-6 text-xl font-semibold">Seasonal guides</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {GUIDES.map((g, i) => (
            <Card key={g.title} className="tilt-card p-6 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <h3 className="mb-3 font-semibold">{g.title}</h3>
              <ol className="space-y-2 text-sm text-muted-foreground">
                {g.steps.map((s, idx) => (
                  <li key={s} className="flex gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {idx + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
