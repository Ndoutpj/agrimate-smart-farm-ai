import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Droplets, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/irrigation")({
  component: IrrigationPage,
  head: () => ({ meta: [{ title: "Irrigation — AgriMate" }] }),
});

type Item = {
  id: string;
  crop_id: string | null;
  day_of_week: number;
  time_of_day: string;
  duration_minutes: number;
  method: string | null;
  enabled: boolean;
};
type CropOpt = { id: string; crop: string };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function IrrigationPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [crops, setCrops] = useState<CropOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ crop_id: "none", day_of_week: "1", time_of_day: "06:00", duration_minutes: "30", method: "drip" });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: i }, { data: c }] = await Promise.all([
      supabase.from("irrigation_schedule").select("*").eq("user_id", user.id).order("day_of_week").order("time_of_day"),
      supabase.from("farm_crops").select("id, crop").eq("user_id", user.id).order("crop"),
    ]);
    setItems((i as Item[]) ?? []);
    setCrops((c as CropOpt[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("irrigation_schedule").insert({
      user_id: user.id,
      crop_id: form.crop_id === "none" ? null : form.crop_id,
      day_of_week: Number(form.day_of_week),
      time_of_day: form.time_of_day,
      duration_minutes: Number(form.duration_minutes) || 30,
      method: form.method,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Schedule added");
    load();
  };

  const toggle = async (id: string, val: boolean) => {
    await supabase.from("irrigation_schedule").update({ enabled: val }).eq("id", id);
    load();
  };
  const remove = async (id: string) => {
    await supabase.from("irrigation_schedule").delete().eq("id", id);
    load();
  };

  const cropName = (id: string | null) => crops.find((c) => c.id === id)?.crop ?? "All crops";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Irrigation Scheduler</h1>
          <p className="text-sm text-muted-foreground">Plan watering times by day of week to save water and stay consistent.</p>
        </div>

        <Card className="space-y-3 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Crop</Label>
              <Select value={form.crop_id} onValueChange={(v) => setForm({ ...form, crop_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All crops</SelectItem>
                  {crops.map((c) => <SelectItem key={c.id} value={c.id}>{c.crop}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Day</Label>
              <Select value={form.day_of_week} onValueChange={(v) => setForm({ ...form, day_of_week: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS.map((d, i) => <SelectItem key={d} value={String(i)}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Time</Label>
              <Input type="time" value={form.time_of_day} onChange={(e) => setForm({ ...form, time_of_day: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Duration (min)</Label>
              <Input type="number" min={1} value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
            </div>
            <div className="col-span-2 grid gap-1.5">
              <Label>Method</Label>
              <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="drip">Drip</SelectItem>
                  <SelectItem value="sprinkler">Sprinkler</SelectItem>
                  <SelectItem value="flood">Flood</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={save} disabled={saving} className="w-full min-h-12">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Add schedule
          </Button>
        </Card>

        {loading ? (
          <div className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…</div>
        ) : items.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 p-10 text-center">
            <Droplets className="h-10 w-10 text-primary" />
            <div className="font-semibold">No schedules yet</div>
            <p className="text-sm text-muted-foreground">Add your first watering slot above.</p>
          </Card>
        ) : (
          <div className="grid gap-3">
            {items.map((it) => (
              <Card key={it.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{DAYS[it.day_of_week]} · {it.time_of_day.slice(0, 5)} · {it.duration_minutes} min</div>
                  <div className="text-xs text-muted-foreground">{cropName(it.crop_id)} · {it.method ?? "—"}</div>
                </div>
                <Switch checked={it.enabled} onCheckedChange={(v) => toggle(it.id, v)} />
                <Button size="icon" variant="ghost" onClick={() => remove(it.id)} aria-label="Delete">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
