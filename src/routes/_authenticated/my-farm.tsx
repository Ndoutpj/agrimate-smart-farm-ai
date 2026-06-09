import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Sprout, Trash2, BookOpen, Droplets, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/my-farm")({
  component: MyFarmPage,
  head: () => ({ meta: [{ title: "My Farm — AgriMate" }] }),
});

type Crop = {
  id: string;
  crop: string;
  field_name: string | null;
  hectares: number;
  planting_date: string | null;
  expected_harvest_date: string | null;
  status: string;
  notes: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-muted text-foreground",
  growing: "bg-primary/15 text-primary",
  harvested: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  fallow: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
};

function MyFarmPage() {
  const { user } = useAuth();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    crop: "",
    field_name: "",
    hectares: "1",
    planting_date: "",
    expected_harvest_date: "",
    status: "planned",
    notes: "",
  });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("farm_crops")
      .select("*")
      .eq("user_id", user.id)
      .order("planting_date", { ascending: false });
    setCrops((data as Crop[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  const save = async () => {
    if (!user) return;
    if (!form.crop.trim()) return toast.error("Crop name required");
    setSaving(true);
    const { error } = await supabase.from("farm_crops").insert({
      user_id: user.id,
      crop: form.crop.trim(),
      field_name: form.field_name.trim() || null,
      hectares: Number(form.hectares) || 0,
      planting_date: form.planting_date || null,
      expected_harvest_date: form.expected_harvest_date || null,
      status: form.status,
      notes: form.notes.trim() || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Crop added");
    setOpen(false);
    setForm({ crop: "", field_name: "", hectares: "1", planting_date: "", expected_harvest_date: "", status: "planned", notes: "" });
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("farm_crops").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("farm_crops").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const totalHa = crops.reduce((s, c) => s + Number(c.hectares || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 animate-fade-up">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">My Farm</h1>
            <p className="text-sm text-muted-foreground">Track every crop on your farm — rotation, sowing, harvest.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="min-h-12"><Plus className="mr-2 h-5 w-5" />Add crop</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add a crop</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label>Crop *</Label>
                  <Input placeholder="Maize" value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Field name</Label>
                    <Input placeholder="North field" value={form.field_name} onChange={(e) => setForm({ ...form, field_name: e.target.value })} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Hectares</Label>
                    <Input type="number" min={0} step="0.1" value={form.hectares} onChange={(e) => setForm({ ...form, hectares: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Planted</Label>
                    <Input type="date" value={form.planting_date} onChange={(e) => setForm({ ...form, planting_date: e.target.value })} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Expected harvest</Label>
                    <Input type="date" value={form.expected_harvest_date} onChange={(e) => setForm({ ...form, expected_harvest_date: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="growing">Growing</SelectItem>
                      <SelectItem value="harvested">Harvested</SelectItem>
                      <SelectItem value="fallow">Fallow / rotating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Notes</Label>
                  <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={save} disabled={saving} className="w-full min-h-12">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Save crop
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Crops tracked</div>
            <div className="mt-1 text-2xl font-bold">{crops.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Total hectares</div>
            <div className="mt-1 text-2xl font-bold">{totalHa.toFixed(1)} ha</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Growing now</div>
            <div className="mt-1 text-2xl font-bold">{crops.filter(c => c.status === "growing").length}</div>
          </Card>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Link to={"/journal" as never}>
            <Card className="tilt-card flex items-center gap-3 p-4">
              <BookOpen className="h-6 w-6 text-primary" />
              <div><div className="font-semibold">Farm Journal</div><div className="text-xs text-muted-foreground">Daily logbook</div></div>
            </Card>
          </Link>
          <Link to={"/irrigation" as never}>
            <Card className="tilt-card flex items-center gap-3 p-4">
              <Droplets className="h-6 w-6 text-primary" />
              <div><div className="font-semibold">Irrigation</div><div className="text-xs text-muted-foreground">Watering schedule</div></div>
            </Card>
          </Link>
          <Link to={"/stats" as never}>
            <Card className="tilt-card flex items-center gap-3 p-4">
              <BarChart3 className="h-6 w-6 text-primary" />
              <div><div className="font-semibold">Stats & P&amp;L</div><div className="text-xs text-muted-foreground">Profit per crop</div></div>
            </Card>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…</div>
        ) : crops.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 p-10 text-center">
            <Sprout className="h-10 w-10 text-primary" />
            <div className="font-semibold">No crops yet</div>
            <p className="max-w-sm text-sm text-muted-foreground">Add your first crop to plan rotation, log activity, and track profit.</p>
          </Card>
        ) : (
          <div className="grid gap-3">
            {crops.map((c) => (
              <Card key={c.id} className="tilt-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{c.crop}</h3>
                      <Badge className={STATUS_COLORS[c.status] ?? STATUS_COLORS.planned}>{c.status}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {c.field_name && <>📍 {c.field_name} · </>}{Number(c.hectares).toFixed(1)} ha
                      {c.planting_date && <> · planted {c.planting_date}</>}
                      {c.expected_harvest_date && <> · harvest {c.expected_harvest_date}</>}
                    </div>
                    {c.notes && <p className="mt-2 text-sm">{c.notes}</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Select value={c.status} onValueChange={(v) => updateStatus(c.id, v)}>
                        <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planned">Planned</SelectItem>
                          <SelectItem value="growing">Growing</SelectItem>
                          <SelectItem value="harvested">Harvested</SelectItem>
                          <SelectItem value="fallow">Fallow / rotating</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => remove(c.id)} aria-label="Delete crop">
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
