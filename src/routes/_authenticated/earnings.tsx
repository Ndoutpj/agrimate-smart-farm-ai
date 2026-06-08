import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Loader2, Wallet, TrendingUp, CheckCircle2, Clock } from "lucide-react";

type Booking = {
  id: string;
  total_price: number;
  status: string;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/earnings")({
  component: EarningsPage,
});

function EarningsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("bookings")
      .select("id,total_price,status,created_at")
      .eq("provider_id", user.id)
      .then(({ data }) => {
        setItems((data as Booking[]) ?? []);
        setLoading(false);
      });
  }, [user?.id]);

  const stats = useMemo(() => {
    let pending = 0, accepted = 0, completed = 0;
    for (const b of items) {
      const n = Number(b.total_price) || 0;
      if (b.status === "pending") pending += n;
      else if (b.status === "accepted") accepted += n;
      else if (b.status === "completed") completed += n;
    }
    return { pending, accepted, completed, total: pending + accepted + completed };
  }, [items]);

  const monthly = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of items) {
      if (b.status !== "completed") continue;
      const k = b.created_at.slice(0, 7);
      map.set(k, (map.get(k) ?? 0) + Number(b.total_price));
    }
    return Array.from(map.entries()).sort().slice(-6);
  }, [items]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="mb-6 text-sm text-muted-foreground">Track your service provider income.</p>

        {loading ? (
          <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard icon={Wallet} label="Total" value={stats.total} accent="text-primary" />
              <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} accent="text-green-600" />
              <StatCard icon={TrendingUp} label="In progress" value={stats.accepted} accent="text-blue-600" />
              <StatCard icon={Clock} label="Pending" value={stats.pending} accent="text-amber-600" />
            </div>

            <Card className="mt-6 p-5">
              <h2 className="mb-4 font-semibold">Completed earnings — last 6 months</h2>
              {monthly.length === 0 ? (
                <p className="text-sm text-muted-foreground">No completed bookings yet.</p>
              ) : (
                <div className="space-y-2">
                  {monthly.map(([month, amount]) => {
                    const max = Math.max(...monthly.map(([, v]) => v));
                    const pct = max > 0 ? (amount / max) * 100 : 0;
                    return (
                      <div key={month}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-muted-foreground">{month}</span>
                          <span className="font-semibold">R{amount.toFixed(2)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: typeof Wallet; label: string; value: number; accent: string }) {
  return (
    <Card className="p-4">
      <Icon className={`h-5 w-5 ${accent}`} />
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">R{value.toFixed(2)}</p>
    </Card>
  );
}
