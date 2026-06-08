import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, MapPin, Search, Wrench } from "lucide-react";
import { toast } from "sonner";

type Service = {
  id: string;
  provider_id: string;
  title: string;
  category: string;
  description: string | null;
  price_per_unit: number;
  unit: string;
  location: string | null;
  service_area: string | null;
};

export const Route = createFileRoute("/_authenticated/equipment")({
  component: EquipmentPage,
});

function EquipmentPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Service | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("services")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        if (!cancelled) {
          setItems((data as Service[]) ?? []);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((s) =>
      `${s.title} ${s.category} ${s.location ?? ""} ${s.service_area ?? ""}`.toLowerCase().includes(needle),
    );
  }, [items, q]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="text-2xl font-bold">Equipment & Services</h1>
        <p className="mb-4 text-sm text-muted-foreground">Book tractors, drones, transport and more.</p>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search category, name, location" className="pl-9" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">No services match.</Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => (
              <Card key={s.id} className="p-4 cursor-pointer hover:shadow-lg transition space-y-1" onClick={() => setSelected(s)}>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Wrench className="h-3.5 w-3.5" /> {s.category}
                </div>
                <h3 className="font-semibold line-clamp-1">{s.title}</h3>
                <p className="text-lg font-bold text-primary">
                  R{Number(s.price_per_unit).toFixed(2)}<span className="text-xs font-normal text-muted-foreground">/{s.unit}</span>
                </p>
                {s.location && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {s.location}
                  </p>
                )}
                {s.service_area && <p className="text-xs text-muted-foreground line-clamp-1">Area: {s.service_area}</p>}
              </Card>
            ))}
          </div>
        )}
      </main>

      {selected && user && (
        <BookDialog service={selected} farmerId={user.id} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function BookDialog({ service, farmerId, onClose }: { service: Service; farmerId: string; onClose: () => void }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hours, setHours] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const qty = service.unit === "hour" ? Number(hours) || 0 : 1;
  const total = qty * Number(service.price_per_unit);

  const submit = async () => {
    if (!startDate) return toast.error("Pick a start date");
    setSaving(true);
    const { error } = await supabase.from("bookings").insert({
      service_id: service.id,
      farmer_id: farmerId,
      provider_id: service.provider_id,
      start_date: startDate,
      end_date: endDate || null,
      hours: hours ? Number(hours) : null,
      total_price: total,
      contact_phone: phone.trim() || null,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (error) return toast.error("Could not book", { description: error.message });
    toast.success("Booking request sent");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{service.title}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm">
            <span className="font-bold">R{Number(service.price_per_unit).toFixed(2)}</span>/{service.unit} · {service.category}
          </p>
          {service.description && <p className="text-sm text-muted-foreground">{service.description}</p>}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Start date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>End date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          {service.unit === "hour" && (
            <div>
              <Label>Estimated hours</Label>
              <Input type="number" min="0" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} />
            </div>
          )}
          <div>
            <Label>Your phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712345678" maxLength={20} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={300} />
          </div>
          <div className="rounded-lg bg-muted p-3 flex justify-between items-center">
            <span className="text-sm">Estimated total</span>
            <span className="text-xl font-bold text-primary">R{total.toFixed(2)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Sending…" : "Request booking"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
