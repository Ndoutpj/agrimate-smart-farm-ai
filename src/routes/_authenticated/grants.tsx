import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Banknote,
  Calendar,
  MapPin,
  ExternalLink,
  Loader2,
  Filter,
  Info,
  Landmark,
  RefreshCw,
  Search,
} from "lucide-react";
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

const PROVINCES = [
  "All",
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Limpopo",
  "Eastern Cape",
  "Mpumalanga",
  "Free State",
  "North West",
  "Northern Cape",
];

const UNVERIFIED_SEED_TITLES = new Set([
  "ilima/letsema smallholder support",
  "casp comprehensive agricultural support",
  "land bank young farmer fund",
  "gauteng vegetable tunnel initiative",
  "western cape drought relief",
  "kzn sugarcane replanting support",
  "limpopo macadamia expansion",
]);

type FundingSource = {
  id: string;
  name: string;
  organization: string;
  category: string;
  province: string | null;
  summary: string;
  url: string;
};

const FUNDING_SOURCES: FundingSource[] = [
  {
    id: "national-agriculture",
    name: "Department of Agriculture",
    organization: "National government",
    category: "National support",
    province: null,
    summary:
      "Check national agriculture programmes and ask the department about current farmer support and application routes.",
    url: "https://www.nda.gov.za/",
  },
  {
    id: "land-bank",
    name: "Land Bank funding",
    organization: "Land and Agricultural Development Bank of South Africa",
    category: "Development finance",
    province: null,
    summary:
      "Explore agricultural finance products and ask about current blended-finance or development-funding options.",
    url: "https://landbank.co.za/",
  },
  {
    id: "dtic",
    name: "Agro-processing incentives",
    organization: "Department of Trade, Industry and Competition",
    category: "Business incentives",
    province: null,
    summary:
      "Check current incentives for eligible agro-processing businesses; these are not general farm-input subsidies.",
    url: "https://www.thedtic.gov.za/",
  },
  {
    id: "gauteng",
    name: "Gauteng agriculture support",
    organization: "Gauteng Provincial Government",
    category: "Provincial support",
    province: "Gauteng",
    summary:
      "Contact the provincial government to confirm current farmer support, eligibility and application dates.",
    url: "https://www.gauteng.gov.za/",
  },
  {
    id: "western-cape",
    name: "Western Cape agriculture support",
    organization: "Western Cape Department of Agriculture",
    category: "Provincial support",
    province: "Western Cape",
    summary:
      "Visit the provincial agriculture portal for current programmes, extension contacts and application guidance.",
    url: "https://www.elsenburg.com/",
  },
  {
    id: "kwazulu-natal",
    name: "KwaZulu-Natal agriculture support",
    organization: "KwaZulu-Natal Department of Agriculture and Rural Development",
    category: "Provincial support",
    province: "KwaZulu-Natal",
    summary:
      "Ask the provincial department to confirm current farmer support calls and local application requirements.",
    url: "https://www.kzndard.gov.za/",
  },
  {
    id: "limpopo",
    name: "Limpopo agriculture support",
    organization: "Limpopo Department of Agriculture and Rural Development",
    category: "Provincial support",
    province: "Limpopo",
    summary:
      "Check with the provincial department for current programmes, eligibility and district-level support.",
    url: "https://www.ldard.gov.za/",
  },
  {
    id: "eastern-cape",
    name: "Eastern Cape agriculture support",
    organization: "Eastern Cape Department of Agriculture",
    category: "Provincial support",
    province: "Eastern Cape",
    summary:
      "Contact the provincial department to confirm current farmer programmes and application windows.",
    url: "https://www.ecagriculture.gov.za/",
  },
  {
    id: "mpumalanga",
    name: "Mpumalanga agriculture support",
    organization: "Mpumalanga Provincial Government",
    category: "Provincial support",
    province: "Mpumalanga",
    summary:
      "Use the provincial government portal to find agriculture department contacts and current support information.",
    url: "https://www.mpg.gov.za/",
  },
  {
    id: "free-state",
    name: "Free State agriculture support",
    organization: "Free State Provincial Government",
    category: "Provincial support",
    province: "Free State",
    summary:
      "Contact the provincial agriculture department to ask about current farmer support and how to apply.",
    url: "https://www.freestateonline.fs.gov.za/",
  },
  {
    id: "north-west",
    name: "North West agriculture support",
    organization: "North West Provincial Government · national contact directory",
    category: "Provincial support",
    province: "North West",
    summary:
      "Use the official national directory to find the provincial agriculture department and confirm open support programmes.",
    url: "https://www.gov.za/about-government/contact-directory",
  },
  {
    id: "northern-cape",
    name: "Northern Cape agriculture support",
    organization: "Northern Cape Provincial Government · national contact directory",
    category: "Provincial support",
    province: "Northern Cape",
    summary:
      "Use the official national directory to find the provincial agriculture department and confirm current farmer programmes.",
    url: "https://www.gov.za/about-government/contact-directory",
  },
];

function GrantsPage() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [province, setProvince] = useState("All");

  const loadGrants = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await supabase
        .from("grants")
        .select("*")
        .eq("is_active", true)
        .order("deadline", { ascending: true, nullsFirst: false });
      if (error) throw error;
      const today = new Date().toISOString().slice(0, 10);
      setGrants(
        ((data ?? []) as Grant[]).filter(
          (grant) =>
            !UNVERIFIED_SEED_TITLES.has(grant.title.toLowerCase()) &&
            (!grant.deadline || grant.deadline >= today),
        ),
      );
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load AgriMate listings.");
      setGrants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGrants();
  }, [loadGrants]);

  const filtered = useMemo(() => {
    return grants.filter((g) => {
      if (province !== "All" && g.province && g.province !== province) return false;
      if (q) {
        const hay =
          `${g.title} ${g.provider ?? ""} ${g.description ?? ""} ${(g.crops ?? []).join(" ")}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [grants, q, province]);

  const filteredSources = useMemo(() => {
    return FUNDING_SOURCES.filter((source) => {
      if (province !== "All" && source.province && source.province !== province) return false;
      const hay = `${source.name} ${source.organization} ${source.summary} ${source.category} ${
        source.province ?? "South Africa"
      }`.toLowerCase();
      return hay.includes(q.trim().toLowerCase());
    });
  }, [q, province]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 animate-fade-up sm:px-6 lg:py-10">
        <section className="flex flex-col gap-5 rounded-3xl border border-border/70 bg-[var(--gradient-soft)] p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Banknote className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-medium text-primary">South Africa · farmer funding</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Grants &amp; support finder
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Find AgriMate-listed opportunities and go straight to official national and
                provincial sources.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => void loadGrants()} disabled={loading}>
            <RefreshCw className={loading ? "animate-spin" : ""} /> Refresh listings
          </Button>
        </section>

        <div className="flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/[0.04] p-4 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-muted-foreground">
            Funding calls change and there is no single official live feed for every South African
            subsidy. This page links to official starting points; confirm eligibility, amounts and
            closing dates with the provider before applying. Finance and business incentives are not
            necessarily grants.
          </p>
        </div>

        <Card className="flex flex-col gap-3 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search funding opportunities and official sources"
              placeholder="Search programme, source, crop or province…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={province} onValueChange={setProvince}>
            <SelectTrigger aria-label="Filter by province" className="w-full sm:w-56">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROVINCES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-xl font-semibold">Current AgriMate listings</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Listings with expired closing dates are hidden. Always confirm details with the
                provider.
              </p>
            </div>
            {!loading && !loadError && (
              <Badge variant="secondary">
                {filtered.length} {filtered.length === 1 ? "listing" : "listings"}
              </Badge>
            )}
          </div>

          {loading ? (
            <div className="flex min-h-36 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading listings…
            </div>
          ) : loadError ? (
            <Card className="p-5 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">AgriMate listings couldn’t load.</p>
              <p className="mt-1">{loadError}</p>
              <Button
                className="mt-4"
                size="sm"
                variant="outline"
                onClick={() => void loadGrants()}
              >
                Try again
              </Button>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="p-6 text-sm text-muted-foreground">
              No current AgriMate listings match this filter. This does not mean funding is
              unavailable—check the official sources below.
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((g) => (
                <Card key={g.id} className="flex flex-col p-5">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <Badge variant="outline">{g.province ?? "National"}</Badge>
                    {g.amount_zar != null && (
                      <span className="text-sm font-semibold text-primary">
                        Listed amount: R{Math.round(g.amount_zar).toLocaleString("en-ZA")}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold">{g.title}</h3>
                  {g.provider && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{g.provider}</p>
                  )}
                  {g.description && (
                    <p className="mt-2 text-sm text-muted-foreground">{g.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {g.deadline && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> Closes{" "}
                        {new Date(`${g.deadline}T12:00:00`).toLocaleDateString()}
                      </span>
                    )}
                    {g.province && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {g.province}
                      </span>
                    )}
                  </div>
                  {g.crops && g.crops.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {g.crops.map((crop) => (
                        <Badge key={crop} variant="secondary">
                          {crop}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {g.url && isSafeExternalUrl(g.url) && (
                    <a href={g.url} target="_blank" rel="noopener noreferrer" className="mt-4">
                      <Button variant="outline" size="sm" className="w-full">
                        Visit application source <ExternalLink />
                      </Button>
                    </a>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Official funding sources</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              National programmes, development finance, business incentives and agriculture
              departments across all nine provinces.
            </p>
          </div>
          {filteredSources.length === 0 ? (
            <Card className="p-5 text-sm text-muted-foreground">
              No official sources match your search. Try a different term or select All provinces.
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredSources.map((source) => (
                <Card
                  key={source.id}
                  className="flex flex-col p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-md)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Landmark className="h-5 w-5" />
                    </span>
                    <Badge variant="secondary">{source.province ?? "National"}</Badge>
                  </div>
                  <h3 className="mt-4 font-semibold">{source.name}</h3>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    {source.organization}
                  </p>
                  <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
                    {source.summary}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/70 pt-3">
                    <span className="text-xs text-muted-foreground">{source.category}</span>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      Official website <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function isSafeExternalUrl(value: string) {
  try {
    return ["https:", "http:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}
