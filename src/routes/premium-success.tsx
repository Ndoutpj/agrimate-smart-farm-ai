import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { usePremium } from "@/lib/premium";

export const Route = createFileRoute("/premium-success")({
  head: () => ({ meta: [{ title: "Welcome to AgriMate Premium 🎉" }] }),
  component: SuccessPage,
});

function SuccessPage() {
  const { isPremium, refresh } = usePremium();
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(5);

  // Poll the profile a few times in case the ITN is a beat behind the redirect.
  useEffect(() => {
    let attempts = 0;
    const id = setInterval(() => {
      attempts += 1;
      refresh();
      if (attempts > 10) clearInterval(id);
    }, 1500);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (!isPremium) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    const r = setTimeout(() => navigate({ to: "/dashboard" }), 5000);
    return () => { clearInterval(t); clearTimeout(r); };
  }, [isPremium, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center">
        <Card className="tilt-card w-full p-8 animate-fade-up">
          {isPremium ? (
            <>
              <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
              <h1 className="mt-4 text-3xl font-bold">Welcome to AgriMate Premium 🎉</h1>
              <p className="mt-2 text-muted-foreground">
                Everything is unlocked. Taking you to your dashboard in {secondsLeft}s…
              </p>
            </>
          ) : (
            <>
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
              <h1 className="mt-4 text-2xl font-bold">Finalising your subscription…</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                PayFast is confirming your payment. This usually takes a few seconds.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" /> R49/month · Cancel anytime
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
