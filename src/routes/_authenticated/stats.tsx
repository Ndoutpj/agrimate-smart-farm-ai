import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Plus, TrendingUp, TrendingDown, Wallet, Coins, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";

export const Route = createFileRoute("/_authenticated/stats")({
  component: StatsPage,
  head: () => ({ meta: [{ title: "Stats & P&L — AgriMate" }] }),
});

type Crop = { id: string; crop: string; hectares: number; status: string };
type Expense = { id: string; crop_id: string | null; category: string; amount_zar: number; spent_on: string };
type Sale = { id: string; crop_id: string | null; amount_zar: number; quantity_kg: number | null; sold_on: string };

const zar = (n: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(n);

function StatsPage() {
  const { user } = useAuth();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [c, e, s] = await Promise.all([
      supabase.from("farm_crops").select("id, crop, hectares, status").eq("user_id", user.id),
      supabase.from("farm_expenses").select("*").eq("user_id", user.id).order("spent_on", { ascending: false }),
      supabase.from("farm_sales").select("*").eq("user_id", user.id).order("sold_on", { ascending: false }),
    ]);
    setCrops((c.data as Crop[]) ?? []);
    setExpenses((e.data as Expense[]) ?? []);
    setSales((s.data as Sale[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  const totals = useMemo(() => {
    const exp = expenses.reduce((s, e) => s + Number(e.amount_zar || 0), 0);
    const rev = sales.reduce((s, x) => s + Number(x.amount_zar || 0), 0);
    return { exp, rev, profit: rev - exp };
  }, [expenses, sales]);

  // Per-crop breakdown
  const perCrop = useMemo(() => {
    return crops.map((c) => {
      const exp = expenses.filter((e) => e.crop_id === c.id).reduce((s, e) => s + Number(e.amount_zar), 0);
      const rev = sales.filter((s) => s.crop_id === c.id).reduce((sum, s) => sum + Number(s.amount_zar), 0);
      const kg = sales.filter((s) => s.crop_id === c.id).reduce((sum, s) => sum + Number(s.quantity_kg || 0), 0);
      return { id: c.id, crop: c.crop, hectares: Number(c.hectares || 0), expenses: exp, revenue: rev, profit: rev - exp, kg };
    }).sort((a, b) => b.profit - a.profit);
  }, [crops, expenses, sales]);

  // 6 month trend
  const monthly = useMemo(() => {
    const buckets: Record<string, { m: string; rev: number; exp: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets[key] = { m: d.toLocaleString("en", { month: "short" }), rev: 0, exp: 0 };
    }
    for (const s of sales) {
      const key = s.sold_on.slice(0, 7);
      if (buckets[key]) buckets[key].rev += Number(s.amount_zar);
    }
    for (const e of expenses) {
      const key = e.spent_on.slice(0, 7);
      if (buckets[key]) buckets[key].exp += Number(e.amount_zar);
    }
    return Object.values(buckets);
  }, [expenses, sales]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 animate-fade-up">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Stats &amp; P&amp;L</h1>
            <p className="text-sm text-muted-foreground">Track expenses, revenue, and profit per crop.</p>
          </div>
          <div className="flex gap-2">
            <AddDialog kind="expense" crops={crops} onSaved={load} />
            <AddDialog kind="sale" crops={crops} onSaved={load} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="tilt-card p-5">
            <div className="flex items-center justify-between"><Coins className="h-5 w-5 text-primary" /><span className="text-xs text-muted-foreground">Revenue</span></div>
            <div className="mt-2 text-2xl font-bold">{zar(totals.rev)}</div>
          </Card>
          <Card className="tilt-card p-5">
            <div className="flex items-center justify-between"><Wallet className="h-5 w-5 text-amber-500" /><span className="text-xs text-muted-foreground">Expenses</span></div>
            <div className="mt-2 text-2xl font-bold">{zar(totals.exp)}</div>
          </Card>
          <Card className="tilt-card p-5">
            <div className="flex items-center justify-between">
              {totals.profit >= 0 ? <TrendingUp className="h-5 w-5 text-emerald-500" /> : <TrendingDown className="h-5 w-5 text-destructive" />}
              <span className="text-xs text-muted-foreground">Profit</span>
            </div>
            <div className={`mt-2 text-2xl font-bold ${totals.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>{zar(totals.profit)}</div>
          </Card>
        </div>

        <Card className="tilt-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Last 6 months</h2>
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} formatter={(v: number) => zar(v)} />
                <Area type="monotone" dataKey="rev" name="Revenue" stroke="var(--primary)" strokeWidth={2} fill="url(#rev)" />
                <Area type="monotone" dataKey="exp" name="Expenses" stroke="#f59e0b" strokeWidth={2} fill="url(#exp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Tabs defaultValue="crops">
          <TabsList>
            <TabsTrigger value="crops">By crop</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
          </TabsList>

          <TabsContent value="crops" className="mt-4 space-y-4">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : perCrop.length === 0 ? (
              <Card className="p-8 text-center text-sm text-muted-foreground">Add crops in My Farm to see per-crop profit.</Card>
            ) : (
              <>
                <Card className="p-5">
                  <h3 className="mb-3 font-semibold">Profit by crop</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={perCrop}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="crop" stroke="var(--muted-foreground)" fontSize={12} />
                        <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                        <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} formatter={(v: number) => zar(v)} />
                        <Bar dataKey="profit" radius={[6, 6, 0, 0]}>
                          {perCrop.map((p, i) => (
                            <Cell key={i} fill={p.profit >= 0 ? "var(--primary)" : "hsl(var(--destructive))"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <div className="grid gap-3 md:grid-cols-2">
                  {perCrop.map((p) => (
                    <Card key={p.id} className="tilt-card p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{p.crop}</h3>
                        <span className="text-xs text-muted-foreground">{p.hectares.toFixed(1)} ha</span>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                        <div><div className="text-muted-foreground">Revenue</div><div className="font-medium">{zar(p.revenue)}</div></div>
                        <div><div className="text-muted-foreground">Expenses</div><div className="font-medium">{zar(p.expenses)}</div></div>
                        <div><div className="text-muted-foreground">Profit</div><div className={`font-semibold ${p.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>{zar(p.profit)}</div></div>
                      </div>
                      {p.kg > 0 && <div className="mt-2 text-xs text-muted-foreground">Sold: {p.kg.toFixed(0)} kg</div>}
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="expenses" className="mt-4 space-y-2">
            {expenses.length === 0 ? (
              <Card className="p-8 text-center text-sm text-muted-foreground">No expenses logged.</Card>
            ) : expenses.map((e) => (
              <Card key={e.id} className="flex items-center justify-between p-3 text-sm">
                <div><div className="font-medium">{e.category}</div><div className="text-xs text-muted-foreground">{e.spent_on}{crops.find(c=>c.id===e.crop_id) && <> · {crops.find(c=>c.id===e.crop_id)!.crop}</>}</div></div>
                <div className="font-semibold">{zar(Number(e.amount_zar))}</div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="sales" className="mt-4 space-y-2">
            {sales.length === 0 ? (
              <Card className="p-8 text-center text-sm text-muted-foreground">No sales logged.</Card>
            ) : sales.map((s) => (
              <Card key={s.id} className="flex items-center justify-between p-3 text-sm">
                <div><div className="font-medium">{crops.find(c=>c.id===s.crop_id)?.crop ?? "Sale"}</div><div className="text-xs text-muted-foreground">{s.sold_on}{s.quantity_kg && <> · {Number(s.quantity_kg).toFixed(0)} kg</>}</div></div>
                <div className="font-semibold text-emerald-600 dark:text-emerald-400">{zar(Number(s.amount_zar))}</div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function AddDialog({ kind, crops, onSaved }: { kind: "expense" | "sale"; crops: Crop[]; onSaved: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({
    crop_id: "none",
    category: "seeds",
    amount: "",
    qty: "",
    buyer: "",
    note: "",
    date: today,
  });

  const save = async () => {
    if (!user) return;
    const amt = Number(f.amount);
    if (!amt || amt <= 0) return toast.error("Amount required");
    setSaving(true);
    const cropId = f.crop_id === "none" ? null : f.crop_id;
    let error: { message: string } | null = null;
    if (kind === "expense") {
      ({ error } = await supabase.from("farm_expenses").insert({
        user_id: user.id, crop_id: cropId, category: f.category, amount_zar: amt,
        spent_on: f.date, note: f.note || null,
      }));
    } else {
      ({ error } = await supabase.from("farm_sales").insert({
        user_id: user.id, crop_id: cropId, buyer: f.buyer || null,
        quantity_kg: f.qty ? Number(f.qty) : null, amount_zar: amt,
        sold_on: f.date, note: f.note || null,
      }));
    }
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(kind === "expense" ? "Expense logged" : "Sale logged");
    setOpen(false);
    setF({ crop_id: "none", category: "seeds", amount: "", qty: "", buyer: "", note: "", date: today });
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={kind === "expense" ? "outline" : "default"} className="min-h-11">
          <Plus className="mr-2 h-4 w-4" />{kind === "expense" ? "Expense" : "Sale"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{kind === "expense" ? "Log expense" : "Log sale"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Crop</Label>
            <Select value={f.crop_id} onValueChange={(v) => setF({ ...f, crop_id: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— general —</SelectItem>
                {crops.map((c) => <SelectItem key={c.id} value={c.id}>{c.crop}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {kind === "expense" ? (
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="seeds">Seeds</SelectItem>
                  <SelectItem value="fertilizer">Fertilizer</SelectItem>
                  <SelectItem value="pesticides">Pesticides</SelectItem>
                  <SelectItem value="labor">Labor</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="fuel">Fuel</SelectItem>
                  <SelectItem value="water">Water</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <>
              <div className="grid gap-1.5">
                <Label>Buyer (optional)</Label>
                <Input value={f.buyer} onChange={(e) => setF({ ...f, buyer: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Quantity (kg)</Label>
                <Input type="number" min={0} step="0.1" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} />
              </div>
            </>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Amount (ZAR)</Label>
              <Input type="number" min={0} step="0.01" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Date</Label>
              <Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={saving} className="w-full min-h-12">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
