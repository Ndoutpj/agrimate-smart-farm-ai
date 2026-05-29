import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";

type PremiumState = {
  isPremium: boolean;
  plan: string;
  loading: boolean;
  nextBillingDate: string | null;
  subscriptionStatus: string | null;
  refresh: () => Promise<void>;
  openUpgrade: (feature?: string) => void;
};

const Ctx = createContext<PremiumState>({
  isPremium: false,
  plan: "free",
  loading: true,
  nextBillingDate: null,
  subscriptionStatus: null,
  refresh: async () => {},
  openUpgrade: () => {},
});

export const usePremium = () => useContext(Ctx);

export function PremiumProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [plan, setPlan] = useState("free");
  const [nextBillingDate, setNextBillingDate] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [feature, setFeature] = useState<string | undefined>();

  const refresh = async () => {
    if (!user) {
      setIsPremium(false);
      setPlan("free");
      setNextBillingDate(null);
      setSubscriptionStatus(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("is_premium, plan, next_billing_date, subscription_status")
      .eq("id", user.id)
      .maybeSingle();
    setIsPremium(!!data?.is_premium);
    setPlan(data?.plan ?? "free");
    setNextBillingDate(data?.next_billing_date ?? null);
    setSubscriptionStatus(data?.subscription_status ?? null);
    setLoading(false);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user?.id]);

  // Realtime: when the webhook flips is_premium, the UI updates instantly.
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`profile-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as any;
          setIsPremium(!!row.is_premium);
          setPlan(row.plan ?? "free");
          setNextBillingDate(row.next_billing_date ?? null);
          setSubscriptionStatus(row.subscription_status ?? null);
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const openUpgrade = (f?: string) => { setFeature(f); setDialogOpen(true); };

  return (
    <Ctx.Provider value={{ isPremium, plan, loading, nextBillingDate, subscriptionStatus, refresh, openUpgrade }}>
      {children}
      <UpgradeDialog open={dialogOpen} onOpenChange={setDialogOpen} feature={feature} />
    </Ctx.Provider>
  );
}

function UpgradeDialog({
  open, onOpenChange, feature,
}: { open: boolean; onOpenChange: (v: boolean) => void; feature?: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">Unlock AgriMate Premium</DialogTitle>
          <DialogDescription className="text-center">
            {feature ? `"${feature}" is a Premium feature. ` : "This is a Premium feature. "}
            Upgrade for <span className="font-semibold text-foreground">R49/month</span> to unlock everything.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 text-sm">
          {[
            "14-day weather forecast",
            "Unlimited AI Crop Doctor diagnoses",
            "Advanced analytics & budget tracking",
            "Post in the Q&A community",
            "Pro mentorship & premium groups",
          ].map((b) => (
            <li key={b} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 text-primary" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex flex-col gap-2">
          <Button
            onClick={() => {
              onOpenChange(false);
              if (!user) navigate({ to: "/login" });
              else navigate({ to: "/upgrade" });
            }}
            className="w-full bg-gradient-to-r from-primary to-primary-glow"
          >
            <Sparkles className="mr-2 h-4 w-4" /> Upgrade Now — R49/month
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Maybe later</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Inline lock badge used over premium-only UI. */
export function LockBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300 ${className}`}>
      <Lock className="h-3 w-3" /> Premium
    </span>
  );
}

/** Wrap a clickable area: blurred + locked for free users, gated by upgrade dialog. */
export function PremiumGate({
  children, feature, className = "",
}: { children: ReactNode; feature: string; className?: string }) {
  const { isPremium, openUpgrade } = usePremium();
  if (isPremium) return <>{children}</>;
  return (
    <button
      type="button"
      onClick={() => openUpgrade(feature)}
      className={`group relative block w-full text-left ${className}`}
    >
      <div className="pointer-events-none select-none blur-[2px] opacity-70">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/40 backdrop-blur-[1px] transition group-hover:bg-background/55">
        <div className="flex items-center gap-2 rounded-full border bg-card/90 px-3 py-1.5 text-xs font-medium shadow-sm">
          <Lock className="h-3.5 w-3.5 text-amber-600" /> Unlock with Premium
        </div>
      </div>
    </button>
  );
}
