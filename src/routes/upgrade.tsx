import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Check, ShieldCheck } from "lucide-react";
import { createPayfastSubscription } from "@/lib/payfast.functions";
import { useAuth } from "@/lib/auth";
import { usePremium } from "@/lib/premium";
import { toast } from "sonner";

export const Route = createFileRoute("/upgrade")({
  head: () => ({
    meta: [
      { title: "Upgrade to AgriMate Premium — R49/month" },
      {
        name: "description",
        content:
          "Unlock 14-day weather, unlimited AI Crop Doctor, analytics, community posting and more.",
      },
    ],
  }),
  component: UpgradePage,
});

function UpgradePage() {
  const { user, loading: authLoading } = useAuth();
  const { isPremium } = usePremium();
  const navigate = useNavigate();
  const startSub = useServerFn(createPayfastSubscription);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (isPremium) navigate({ to: "/dashboard" });
  }, [isPremium, navigate]);

  const checkout = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await startSub({ data: { returnOrigin: window.location.origin } });
      const f = document.createElement("form");
      f.method = "POST";
      f.action = res.action;
      f.style.display = "none";
      for (const [k, v] of Object.entries(res.fields)) {
        const i = document.createElement("input");
        i.type = "hidden";
        i.name = k;
        i.value = String(v);
        f.appendChild(i);
      }
      document.body.appendChild(f);
      f.submit();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Couldn't start checkout";
      toast.error(message);
      setSubmitting(false);
    }
  };

  const features = [
    "14-day weather forecast with severe alerts",
    "Unlimited AI Crop Doctor diagnoses",
    "Advanced analytics & budget tracking",
    "Post questions in the Q&A community",
    "Pro mentorship & premium groups",
    "Priority support",
  ];

  const packs = [
    {
      title: "Plan",
      text: "Know what to plant, when to irrigate, and how much each crop will cost before you commit.",
    },
    {
      title: "Prevent",
      text: "Catch disease, stress, and weather risk early using AI diagnosis and forecast alerts.",
    },
    {
      title: "Profit",
      text: "Turn smarter decisions into better yields, stronger margins, and less waste on the farm.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 bg-[var(--gradient-soft)]" />
        <div className="absolute -top-24 -right-24 -z-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-blob" />
        <div className="mx-auto max-w-3xl px-4 py-12 text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> AgriMate Premium
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Everything you need in one <span className="text-primary">farming pack</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Unlock better planning, faster alerts, and smarter decisions across your farm.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {packs.map((pack) => (
            <div key={pack.title} className="rounded-2xl border border-border/70 bg-card p-5">
              <div className="mb-3 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {pack.title}
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{pack.text}</p>
            </div>
          ))}
        </div>

        <Card className="tilt-card overflow-hidden p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-5xl font-bold">R49</div>
              <div className="text-muted-foreground">/ month</div>
            </div>
            <div className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              Simple monthly plan · no hidden costs
            </div>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            Recurring monthly · billed by PayFast · cancel anytime
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {features.map((f) => (
              <div
                key={f}
                className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/30 p-3 text-sm"
              >
                <Check className="mt-0.5 h-4 w-4 text-primary" />
                <span>{f}</span>
              </div>
            ))}
          </div>

          <Button
            size="lg"
            onClick={checkout}
            disabled={submitting}
            className="mt-6 w-full bg-gradient-to-r from-primary to-primary-glow text-base"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting to PayFast…
              </>
            ) : (
              <>Upgrade Now — R49/month</>
            )}
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Secure checkout via PayFast
          </p>
        </Card>
        <form ref={formRef} className="hidden" />
      </div>
    </div>
  );
}
