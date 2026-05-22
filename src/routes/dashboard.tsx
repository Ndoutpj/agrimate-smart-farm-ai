import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sprout, Droplets, CloudSun, Bug, MessageCircle, Calculator, TrendingUp, Leaf } from "lucide-react";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
  Bar, BarChart,
} from "recharts";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AgriMate" },
      { name: "description", content: "Your AgriMate farm dashboard — weather, yields, alerts and quick tools." },
    ],
  }),
  component: Dashboard,
});

const yieldData = [
  { m: "Jul", y: 2.1 }, { m: "Aug", y: 2.6 }, { m: "Sep", y: 3.0 },
  { m: "Oct", y: 3.4 }, { m: "Nov", y: 3.9 }, { m: "Dec", y: 4.6 },
];
const rainData = [
  { d: "Mon", r: 4 }, { d: "Tue", r: 12 }, { d: "Wed", r: 0 },
  { d: "Thu", r: 8 }, { d: "Fri", r: 22 }, { d: "Sat", r: 6 }, { d: "Sun", r: 2 },
];

function Stat({ icon: Icon, label, value, trend }: any) {
  return (
    <Card className="tilt-card p-5">
      <div className="flex items-center justify-between">
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><Icon className="h-5 w-5" /></div>
        {trend && <span className="text-xs font-medium text-primary">{trend}</span>}
      </div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}

function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 bg-[var(--gradient-soft)]" />
        <div className="mx-auto max-w-6xl px-4 py-10 animate-fade-up">
          <p className="text-sm text-muted-foreground">Good morning, farmer 👋</p>
          <h1 className="text-3xl font-bold md:text-4xl">Your farm at a glance</h1>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={Sprout} label="Active fields" value="3" trend="+1 this season" />
          <Stat icon={Droplets} label="Soil moisture" value="42%" trend="optimal" />
          <Stat icon={CloudSun} label="Today" value="24°C ☀️" trend="rain Fri" />
          <Stat icon={TrendingUp} label="Forecast yield" value="4.6 t/ha" trend="+18%" />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="tilt-card p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Yield projection (t/ha)</h2>
              <Leaf className="h-4 w-4 text-primary" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={yieldData}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                  <Area type="monotone" dataKey="y" stroke="var(--primary)" strokeWidth={2} fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="tilt-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Rain (mm, 7d)</h2>
              <CloudSun className="h-4 w-4 text-primary" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rainData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                  <Bar dataKey="r" fill="var(--primary-glow)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/crop-doctor"><Card className="tilt-card group p-5">
            <Bug className="mb-2 h-6 w-6 text-primary transition group-hover:scale-110" />
            <h3 className="font-semibold">AI Crop Doctor</h3>
            <p className="text-sm text-muted-foreground">Diagnose disease from a photo.</p>
          </Card></Link>
          <Link to="/qa"><Card className="tilt-card group p-5">
            <MessageCircle className="mb-2 h-6 w-6 text-primary transition group-hover:scale-110" />
            <h3 className="font-semibold">Ask AgriMate</h3>
            <p className="text-sm text-muted-foreground">24/7 farming Q&amp;A assistant.</p>
          </Card></Link>
          <Link to="/calculator"><Card className="tilt-card group p-5">
            <Calculator className="mb-2 h-6 w-6 text-primary transition group-hover:scale-110" />
            <h3 className="font-semibold">Farm Calculator</h3>
            <p className="text-sm text-muted-foreground">Plan inputs, water, profit.</p>
          </Card></Link>
        </div>

        <div className="flex justify-end">
          <Link to="/tips"><Button variant="outline">Browse farming tips →</Button></Link>
        </div>
      </div>
    </div>
  );
}
