import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef, useEffect } from "react";
import { diagnoseCrop } from "@/lib/ai.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Sparkles, Leaf, Lock } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/lib/auth";
import { usePremium } from "@/lib/premium";
import { supabase } from "@/integrations/supabase/client";

const FREE_DAILY_LIMIT = 3;

export const Route = createFileRoute("/crop-doctor")({
  head: () => ({
    meta: [
      { title: "AI Crop Doctor — AgriMate" },
      { name: "description", content: "Upload a leaf photo and get an instant AI diagnosis with organic and chemical treatment options." },
      { property: "og:title", content: "AI Crop Doctor — AgriMate" },
      { property: "og:description", content: "Instant plant disease diagnosis powered by AI." },
    ],
  }),
  component: CropDoctorPage,
});

function CropDoctorPage() {
  const diagnose = useServerFn(diagnoseCrop);
  const { user } = useAuth();
  const { isPremium, openUpgrade } = usePremium();
  const [preview, setPreview] = useState<string | null>(null);
  const [crop, setCrop] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [usedToday, setUsedToday] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("diagnosis_usage")
      .select("count")
      .eq("user_id", user.id)
      .eq("used_on", today)
      .maybeSingle()
      .then(({ data }) => setUsedToday(data?.count ?? 0));
  }, [user, today]);

  const remaining = Math.max(0, FREE_DAILY_LIMIT - usedToday);

  const onFile = (f: File | undefined) => {
    if (!f) return;
    if (f.size > 6 * 1024 * 1024) return toast.error("Image must be under 6MB");
    const r = new FileReader();
    r.onload = () => setPreview(r.result as string);
    r.readAsDataURL(f);
  };

  const incrementUsage = async () => {
    if (!user) return;
    const next = usedToday + 1;
    setUsedToday(next);
    await supabase
      .from("diagnosis_usage")
      .upsert({ user_id: user.id, used_on: today, count: next, updated_at: new Date().toISOString() }, { onConflict: "user_id,used_on" });
  };

  const submit = async () => {
    if (!preview) return toast.error("Please upload a photo first");
    if (!isPremium && remaining <= 0) {
      openUpgrade("Unlimited Crop Doctor diagnoses");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await diagnose({ data: { imageDataUrl: preview, crop, notes } });
      setResult(res.text);
      if (!isPremium) await incrementUsage();
    } catch (e: any) {
      toast.error(e?.message ?? "Diagnosis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 bg-[var(--gradient-soft)]" />
        <div className="absolute -top-24 -right-24 -z-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-blob" />
        <div className="mx-auto max-w-5xl px-4 py-12 text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Powered by Lovable AI
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            AI <span className="text-primary">Crop Doctor</span>
          </h1>
          <p className="mt-3 text-muted-foreground">Snap a leaf, get a diagnosis in seconds.</p>
          {!isPremium && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-700 dark:text-amber-300">
              <Lock className="h-3 w-3" /> Free plan: {remaining} of {FREE_DAILY_LIMIT} diagnoses left today
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 md:grid-cols-2">
        <Card className="tilt-card overflow-hidden p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Leaf className="h-5 w-5 text-primary" /> Upload photo</h2>

          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
            className="group flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/40 transition hover:border-primary hover:bg-muted"
          >
            {preview ? (
              <img src={preview} alt="leaf preview" className="h-full w-full object-cover" />
            ) : (
              <div className="text-center text-muted-foreground">
                <Upload className="mx-auto mb-2 h-10 w-10 transition group-hover:text-primary" />
                <p className="text-sm">Click or drop a leaf photo</p>
                <p className="text-xs">JPG / PNG, max 6MB</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? undefined)}
          />

          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor="crop">Crop (optional)</Label>
              <Input id="crop" value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="e.g. Tomato, Maize" />
            </div>
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="When did you notice it? Recent weather?" rows={3} />
            </div>
            <Button onClick={submit} disabled={loading || !preview} className="w-full">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Diagnosing…</> : <>Diagnose <Sparkles className="ml-2 h-4 w-4" /></>}
            </Button>
          </div>
        </Card>

        <Card className="tilt-card min-h-[400px] overflow-hidden p-6">
          <h2 className="mb-4 text-lg font-semibold">Diagnosis</h2>
          {!result && !loading && (
            <p className="text-sm text-muted-foreground">Upload a clear photo of the affected leaf, fruit, or stem. The doctor will identify likely diseases and suggest treatments.</p>
          )}
          {loading && (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing leaf…
            </div>
          )}
          {result && (
            <div className="prose prose-sm max-w-none animate-fade-up dark:prose-invert">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
