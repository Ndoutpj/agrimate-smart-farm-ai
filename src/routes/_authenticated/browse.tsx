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
import { Loader2, MapPin, Search } from "lucide-react";
import { ListingImage } from "@/components/ListingImage";
import { toast } from "sonner";

type Listing = {
  id: string;
  farmer_id: string;
  title: string;
  crop: string;
  description: string | null;
  unit: string;
  price_per_unit: number;
  quantity_available: number;
  location: string | null;
  image_url: string | null;
};

export const Route = createFileRoute("/_authenticated/browse")({
  component: BrowsePage,
});

function BrowsePage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selected, setSelected] = useState<Listing | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("listings")
      .select("id,farmer_id,title,crop,description,unit,price_per_unit,quantity_available,location,image_url")
      .eq("status", "active")
      .gt("quantity_available", 0)
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        if (!cancelled) {
          setListings((data as Listing[]) ?? []);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const cap = Number(maxPrice);
    return listings.filter((l) => {
      if (needle && !`${l.title} ${l.crop} ${l.location ?? ""}`.toLowerCase().includes(needle)) return false;
      if (maxPrice && Number(l.price_per_unit) > cap) return false;
      return true;
    });
  }, [listings, q, maxPrice]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="text-2xl font-bold">Browse produce</h1>
        <p className="mb-4 text-sm text-muted-foreground">Buy directly from local farmers.</p>

        <div className="mb-6 flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search crop, name or location"
              className="pl-9"
            />
          </div>
          <Input
            type="number"
            min="0"
            placeholder="Max price"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-32"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">No listings match your filters.</Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((l) => (
              <Card key={l.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition" onClick={() => setSelected(l)}>
                <ListingImage path={l.image_url} alt={l.title} />
                <div className="p-4 space-y-1">
                  <h3 className="font-semibold line-clamp-1">{l.title}</h3>
                  <p className="text-lg font-bold text-primary">
                    R{Number(l.price_per_unit).toFixed(2)}
                    <span className="text-xs font-normal text-muted-foreground">/{l.unit}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{l.quantity_available} {l.unit} available</p>
                  {l.location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {l.location}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {selected && user && (
        <OrderDialog
          listing={selected}
          buyerId={user.id}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function OrderDialog({
  listing,
  buyerId,
  onClose,
}: {
  listing: Listing;
  buyerId: string;
  onClose: () => void;
}) {
  const [qty, setQty] = useState("1");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const total = (Number(qty) || 0) * Number(listing.price_per_unit);

  const submit = async () => {
    const q = Number(qty);
    if (!q || q <= 0) return toast.error("Enter a valid quantity");
    if (q > Number(listing.quantity_available)) return toast.error("Quantity exceeds available stock");
    setSaving(true);
    const { error } = await supabase.from("orders").insert({
      listing_id: listing.id,
      buyer_id: buyerId,
      farmer_id: listing.farmer_id,
      quantity: q,
      total_price: total,
      contact_phone: phone.trim() || null,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (error) return toast.error("Could not place order", { description: error.message });
    toast.success("Order placed! The farmer will confirm shortly.");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{listing.title}</DialogTitle>
        </DialogHeader>
        <ListingImage path={listing.image_url} alt={listing.title} className="h-48 w-full rounded-lg object-cover bg-muted" />
        <div className="space-y-3">
          {listing.description && <p className="text-sm text-muted-foreground">{listing.description}</p>}
          <p className="text-sm">
            <span className="font-semibold">R{Number(listing.price_per_unit).toFixed(2)}</span>/{listing.unit}
            {" · "}
            {listing.quantity_available} {listing.unit} available
          </p>
          {listing.location && <p className="text-xs text-muted-foreground">📍 {listing.location}</p>}
          <div>
            <Label>Quantity ({listing.unit})</Label>
            <Input type="number" min="0.01" step="0.01" max={listing.quantity_available} value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div>
            <Label>Your phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712345678" maxLength={20} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={300} />
          </div>
          <div className="rounded-lg bg-muted p-3 flex justify-between items-center">
            <span className="text-sm">Total</span>
            <span className="text-xl font-bold text-primary">R{total.toFixed(2)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Placing…" : "Place order"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
