import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Wrench, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Service = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  price_per_unit: number;
  unit: string;
  location: string | null;
  service_area: string | null;
  status: "active" | "paused" | "closed";
};

const CATEGORIES = ["Tractor", "Drone", "Transport", "Irrigation", "Harvesting", "Labour", "Other"];

export const Route = createFileRoute("/_authenticated/services")({
  component: ServicesPage,
});

function ServicesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("provider_id", user.id)
      .order("created_at", { ascending: false });
    setItems((data as Service[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const updateStatus = async (id: string, status: Service["status"]) => {
    const { error } = await supabase.from("services").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Service ${status}`);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Services</h1>
            <p className="text-sm text-muted-foreground">List equipment and services you offer to farmers.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" /> New
              </Button>
            </DialogTrigger>
            <NewServiceDialog onClose={() => setOpen(false)} onCreated={load} userId={user!.id} />
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <Card className="p-12 text-center">
            <Wrench className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No services yet. Add your first one!</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((s) => (
              <Card key={s.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="text-xs text-muted-foreground">{s.category}</p>
                  </div>
                  <Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge>
                </div>
                <p className="text-sm">
                  <span className="font-bold text-primary">R{Number(s.price_per_unit).toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground">/{s.unit}</span>
                </p>
                {s.location && <p className="text-xs text-muted-foreground">📍 {s.location}</p>}
                {s.description && <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>}
                <div className="flex flex-wrap gap-2 pt-2">
                  {s.status === "active" ? (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(s.id, "paused")}>Pause</Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(s.id, "active")}>Activate</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => remove(s.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function NewServiceDialog({ onClose, onCreated, userId }: { onClose: () => void; onCreated: () => void; userId: string }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("hour");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [area, setArea] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!title.trim() || !price) return toast.error("Title and price are required");
    setSaving(true);
    const { error } = await supabase.from("services").insert({
      provider_id: userId,
      title: title.trim(),
      category,
      description: description.trim() || null,
      unit,
      price_per_unit: Number(price),
      location: location.trim() || null,
      service_area: area.trim() || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Service added");
    onCreated();
    onClose();
  };

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>New service</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="John Deere 5075E tractor" maxLength={120} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Unit</Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hour">hour</SelectItem>
                <SelectItem value="day">day</SelectItem>
                <SelectItem value="hectare">hectare</SelectItem>
                <SelectItem value="km">km</SelectItem>
                <SelectItem value="job">job</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Price per {unit} (R)</Label>
          <Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div>
          <Label>Base location</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Pretoria, GP" maxLength={120} />
        </div>
        <div>
          <Label>Service area</Label>
          <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Within 50km of Pretoria" maxLength={120} />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={500} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Publish"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
