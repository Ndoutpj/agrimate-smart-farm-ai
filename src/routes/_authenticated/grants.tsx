import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Banknote, Calendar, MapPin, ExternalLink, Loader2, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/grants")({
  component: GrantsPage,
  head: () => ({ meta: [{ title: "Grants & Subsidies — AgriMate" }] }),
});

type Grant = {
  id: string;
  title: string;
  provider: string | null;
  description: string | null;
  province: string | null;
  min_size_ha: number | null;
  max_size_ha: number | null;
  crops: string[] | null;
  amount_zar: number | null;
  deadline: string | null;
  url: string | null;
};

const PROVINCES = ["All", "Gauteng", "Western Cape", "KwaZulu-Natal", "Limpopo", "Eastern Cape", "Mpumalanga", "Free State", "North West", "Northern Cape"];

function GrantsPage() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [province, setProvince] = useState("All");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("grants").select("*").eq("is_active", true).order("deadline", { ascending: true });
      setGrants((data ?? []) as Grant[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return grants.filter((g) => {
      if (province !== "All" && g.province && g.province !== province) return false;
      if (province !== "All" && !g.province) return true; // national grants always show
      if (q) {
        const hay = `${g.title} ${g.provider ?? ""} ${g.description ?? ""} ${(g.crops ?? []).join(" ")}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [grants, q, province]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 animate-fade-up">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary"><Banknote className="h-6 w-6" /></div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Grants & Subsidies Finder</h1>
            <p className="text-sm text-muted-foreground">Funding opportunities for South African farmers.</p>
          </div>
        </div>

        <Card className="flex flex-col gap-3 p-4 sm:flex-row">
          <Input placeholder="Search grants, providers, crops…" value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />
          <Select value={province} onValueChange={setProvince}>
            <SelectTrigger className="w-full sm:w-56"><Filter className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger>
            <SelectContent>{PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </Card>

        {loading ? (
          <div className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading grants…</div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No grants match your filters.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((g) => (
              <Card key={g.id} className="tilt-card flex flex-col p-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Badge variant="outline">{g.province ?? "National"}</Badge>
                  {g.amount_zar && (
                    <span className="text-sm font-semibold text-primary">
                      up to R{Math.round(g.amount_zar).toLocaleString()}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold">{g.title}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{g.provider}</p>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{g.description}</p>

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {g.deadline && (
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Closes {new Date(g.deadline).toLocaleDateString()}</span>
                  )}
                  {g.province && (
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {g.province}</span>
                  )}
                </div>

                {g.crops && g.crops.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {g.crops.map((c) => <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>)}
                  </div>
                )}

                {g.url && (
                  <a href={g.url} target="_blank" rel="noreferrer" className="mt-4">
                    <Button variant="outline" size="sm" className="w-full">
                      Apply / learn more <ExternalLink className="ml-2 h-3.5 w-3.5" />
                    </Button>
                  </a>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
