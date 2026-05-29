import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, MapPin, Wheat, Beef, Crown, Sparkles, CalendarClock, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, initials } from "@/lib/auth";
import { usePremium } from "@/lib/premium";
import { cancelPayfastSubscription } from "@/lib/payfast.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "My Farm — AgriMate" }] }),
});

type Profile = {
  full_name: string | null;
  farm_name: string | null;
  farm_size_ha: number | null;
  location: string | null;
  crops: string[] | null;
  livestock: string[] | null;
  avatar_url: string | null;
};

function ProfilePage() {
  const { user } = useAuth();
  const [p, setP] = useState<Profile>({ full_name: "", farm_name: "", farm_size_ha: null, location: "", crops: [], livestock: [], avatar_url: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setP(data as Profile);
      setLoading(false);
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: p.full_name,
      farm_name: p.farm_name,
      farm_size_ha: p.farm_size_ha,
      location: p.location,
      crops: p.crops ?? [],
      livestock: p.livestock ?? [],
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Farm profile updated");
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 animate-fade-up">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-2xl font-semibold text-primary-foreground shadow-[var(--shadow-glow)]">
            {initials(p.full_name, user?.email)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Farm</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <SubscriptionCard />



        {loading ? (
          <div className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…</div>
        ) : (
          <Card className="tilt-card space-y-5 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full name">
                <Input value={p.full_name ?? ""} onChange={(e) => setP({ ...p, full_name: e.target.value })} />
              </Field>
              <Field label="Farm name">
                <Input value={p.farm_name ?? ""} onChange={(e) => setP({ ...p, farm_name: e.target.value })} placeholder="Green Valley Farm" />
              </Field>
              <Field label="Farm size (hectares)">
                <Input type="number" min={0} step="0.1" value={p.farm_size_ha ?? ""} onChange={(e) => setP({ ...p, farm_size_ha: e.target.value ? Number(e.target.value) : null })} />
              </Field>
              <Field label={<span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Location</span>}>
                <Input value={p.location ?? ""} onChange={(e) => setP({ ...p, location: e.target.value })} placeholder="Limpopo, South Africa" />
              </Field>
            </div>

            <Field label={<span className="inline-flex items-center gap-1"><Wheat className="h-3.5 w-3.5" /> Crops grown</span>} hint="Comma-separated, e.g. maize, tomatoes, beans">
              <Textarea rows={2} value={(p.crops ?? []).join(", ")} onChange={(e) => setP({ ...p, crops: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
            </Field>

            <Field label={<span className="inline-flex items-center gap-1"><Beef className="h-3.5 w-3.5" /> Livestock</span>} hint="Comma-separated, e.g. cattle, goats">
              <Textarea rows={2} value={(p.livestock ?? []).join(", ")} onChange={(e) => setP({ ...p, livestock: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
            </Field>

            <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save changes
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: React.ReactNode; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SubscriptionCard() {
  const { isPremium, plan, nextBillingDate, subscriptionStatus, refresh } = usePremium();
  const cancel = useServerFn(cancelPayfastSubscription);
  const [cancelling, setCancelling] = useState(false);

  const doCancel = async () => {
    if (!confirm("Cancel your AgriMate Premium subscription? You'll lose access to premium features immediately.")) return;
    setCancelling(true);
    try {
      await cancel({});
      await refresh();
      toast.success("Subscription cancelled");
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't cancel");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Card className="tilt-card overflow-hidden p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {isPremium ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 px-2.5 py-1 text-xs font-semibold text-white">
                <Crown className="h-3 w-3" /> Premium
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                Free plan
              </span>
            )}
            {subscriptionStatus && (
              <span className="text-xs text-muted-foreground capitalize">· {subscriptionStatus}</span>
            )}
          </div>
          <h2 className="mt-2 text-lg font-semibold">
            {isPremium ? "AgriMate Premium" : "AgriMate Free"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isPremium ? "R49 / month · billed by PayFast" : "Upgrade to unlock everything for R49/month."}
          </p>
          {isPremium && nextBillingDate && (
            <p className="mt-2 flex items-center gap-1.5 text-sm">
              <CalendarClock className="h-4 w-4 text-primary" />
              Next billing: <span className="font-medium">{new Date(nextBillingDate).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</span>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {isPremium ? (
            <Button variant="outline" size="sm" onClick={doCancel} disabled={cancelling}>
              {cancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
              Cancel plan
            </Button>
          ) : (
            <Link to="/upgrade">
              <Button size="sm" className="bg-gradient-to-r from-primary to-primary-glow">
                <Sparkles className="mr-2 h-4 w-4" /> Upgrade
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
