import { useMemo, useState } from "react";
import {
  CROPS, calculate, num, zar,
  type CalcInput, type CropKey, type IrrigationKey, type SoilKey, type MethodKey,
} from "@/lib/calculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sprout, Droplets, Users, FlaskConical, Wallet, CalendarDays, TrendingUp, LineChart } from "lucide-react";

const irrigations: { key: IrrigationKey; label: string }[] = [
  { key: "rainfed", label: "Rain-fed" },
  { key: "sprinkler", label: "Sprinkler" },
  { key: "drip", label: "Drip" },
  { key: "flood", label: "Flood" },
];
const soils: { key: SoilKey; label: string }[] = [
  { key: "sandy", label: "Sandy" }, { key: "loam", label: "Loam" },
  { key: "clay", label: "Clay" },   { key: "silt", label: "Silt" },
];
const methods: { key: MethodKey; label: string }[] = [
  { key: "manual", label: "Manual" }, { key: "mechanized", label: "Mechanized" }, { key: "mixed", label: "Mixed" },
];

function Stat({
  icon: Icon, label, value, hint, tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; hint?: string;
  tone?: "default" | "primary" | "earth";
}) {
  const toneCls =
    tone === "primary" ? "bg-primary/10 text-primary"
    : tone === "earth" ? "bg-earth/15 text-earth"
    : "bg-muted text-foreground";
  return (
    <div className="group rounded-xl border border-border/70 bg-card p-4 transition-all hover:shadow-[var(--shadow-md)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneCls}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function FarmCalculator() {
  const [input, setInput] = useState<CalcInput>({
    crop: "maize", hectares: 5, irrigation: "drip", soil: "loam", method: "mixed", density: 1,
  });
  const result = useMemo(() => calculate(input), [input]);
  const set = <K extends keyof CalcInput>(k: K, v: CalcInput[K]) => setInput((s) => ({ ...s, [k]: v }));

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-2 border-border/70 shadow-[var(--shadow-sm)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sprout className="h-4 w-4 text-primary" /> Plan your farm
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Crop</Label>
            <Select value={input.crop} onValueChange={(v) => set("crop", v as CropKey)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(CROPS) as CropKey[]).map((k) => (
                  <SelectItem key={k} value={k}>{CROPS[k].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Farm size (hectares)</Label>
            <Input
              type="number" min={0.1} step={0.1} value={input.hectares}
              onChange={(e) => set("hectares", Math.max(0, parseFloat(e.target.value) || 0))}
            />
          </div>

          <div className="space-y-2">
            <Label>Irrigation</Label>
            <Select value={input.irrigation} onValueChange={(v) => set("irrigation", v as IrrigationKey)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {irrigations.map((i) => <SelectItem key={i.key} value={i.key}>{i.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Soil</Label>
              <Select value={input.soil} onValueChange={(v) => set("soil", v as SoilKey)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {soils.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={input.method} onValueChange={(v) => set("method", v as MethodKey)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {methods.map((m) => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Planting density</Label>
              <span className="text-xs text-muted-foreground">{Math.round(input.density * 100)}%</span>
            </div>
            <Slider
              value={[input.density * 100]} min={70} max={130} step={5}
              onValueChange={([v]) => set("density", v / 100)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-3 space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat icon={Sprout}      tone="primary" label="Seed needed"     value={`${num(result.seedKg, 1)} kg`} />
          <Stat icon={Droplets}    tone="primary" label="Water usage"     value={`${num(result.waterM3)} m³`} />
          <Stat icon={Users}                       label="Workers"         value={`${result.workers}`} />
          <Stat icon={FlaskConical}                label="Fertilizer"      value={`${num(result.fertilizerKg)} kg`} />
          <Stat icon={Wallet}      tone="earth"   label="Irrigation cost" value={zar(result.irrigationCostZar)} />
          <Stat icon={CalendarDays}                label="Days to harvest" value={`${result.daysToHarvest}`} />
        </div>

        <Card className="overflow-hidden border-border/70">
          <div className="bg-[var(--gradient-hero)] p-6 text-primary-foreground">
            <div className="flex items-center gap-2 text-sm/none opacity-90">
              <LineChart className="h-4 w-4" /> Season projection
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <div className="text-xs uppercase tracking-wide opacity-80">Total budget</div>
                <div className="mt-1 text-2xl font-semibold">{zar(result.totalBudgetZar)}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide opacity-80">Expected yield</div>
                <div className="mt-1 text-2xl font-semibold">{num(result.expectedYieldTon, 1)} tons</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide opacity-80">Est. revenue</div>
                <div className="mt-1 text-2xl font-semibold">{zar(result.estimatedRevenueZar)}</div>
              </div>
            </div>
          </div>
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              Projected profit this season
            </div>
            <div className={`text-xl font-semibold ${result.estimatedProfitZar >= 0 ? "text-primary" : "text-destructive"}`}>
              {zar(result.estimatedProfitZar)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
