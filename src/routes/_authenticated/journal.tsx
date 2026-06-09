import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, BookOpen, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/journal")({
  component: JournalPage,
  head: () => ({ meta: [{ title: "Farm Journal — AgriMate" }] }),
});

type Entry = { id: string; crop_id: string | null; entry_date: string; title: string; body: string | null };
type CropOpt = { id: string; crop: string };

function JournalPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [crops, setCrops] = useState<CropOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", entry_date: new Date().toISOString().slice(0, 10), crop_id: "none" });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: e }, { data: c }] = await Promise.all([
      supabase.from("farm_journal_entries").select("*").eq("user_id", user.id).order("entry_date", { ascending: false }),
      supabase.from("farm_crops").select("id, crop").eq("user_id", user.id).order("crop"),
    ]);
    setEntries((e as Entry[]) ?? []);
    setCrops((c as CropOpt[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  const save = async () => {
    if (!user) return;
    if (!form.title.trim()) return toast.error("Title required");
    setSaving(true);
    const { error } = await supabase.from("farm_journal_entries").insert({
      user_id: user.id,
      title: form.title.trim(),
      body: form.body.trim() || null,
      entry_date: form.entry_date,
      crop_id: form.crop_id === "none" ? null : form.crop_id,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Logged");
    setForm({ title: "", body: "", entry_date: new Date().toISOString().slice(0, 10), crop_id: "none" });
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("farm_journal_entries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const cropName = (id: string | null) => crops.find((c) => c.id === id)?.crop ?? null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Farm Journal</h1>
          <p className="text-sm text-muted-foreground">Log daily activities — planting, spraying, weather, harvest.</p>
        </div>

        <Card className="space-y-3 p-4">
          <div className="grid gap-1.5">
            <Label>Title</Label>
            <Input placeholder="Sprayed maize with insecticide" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Date</Label>
              <Input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Crop</Label>
              <Select value={form.crop_id} onValueChange={(v) => setForm({ ...form, crop_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— none —</SelectItem>
                  {crops.map((c) => <SelectItem key={c.id} value={c.id}>{c.crop}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Details</Label>
            <Textarea rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </div>
          <Button onClick={save} disabled={saving} className="w-full min-h-12">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Add entry
          </Button>
        </Card>

        {loading ? (
          <div className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…</div>
        ) : entries.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 p-10 text-center">
            <BookOpen className="h-10 w-10 text-primary" />
            <div className="font-semibold">No entries yet</div>
            <p className="text-sm text-muted-foreground">Your farm history starts here.</p>
          </Card>
        ) : (
          <div className="grid gap-3">
            {entries.map((e) => (
              <Card key={e.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted-foreground">{e.entry_date}{cropName(e.crop_id) && <> · {cropName(e.crop_id)}</>}</div>
                    <h3 className="mt-0.5 font-semibold">{e.title}</h3>
                    {e.body && <p className="mt-1 whitespace-pre-wrap text-sm">{e.body}</p>}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => remove(e.id)} aria-label="Delete entry">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
