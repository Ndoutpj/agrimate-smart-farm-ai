import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ChangeEvent } from "react";
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
import { Plus, Loader2, ImagePlus, Trash2 } from "lucide-react";
import { ListingImage } from "@/components/ListingImage";
import { toast } from "sonner";

type Listing = {
  id: string;
  title: string;
  crop: string;
  description: string | null;
  unit: string;
  price_per_unit: number;
  quantity_available: number;
  location: string | null;
  image_url: string | null;
  status: "active" | "sold" | "closed";
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/market")({
  component: MarketPage,
});

function MarketPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("listings")
      .select("*")
      .eq("farmer_id", user.id)
      .order("created_at", { ascending: false });
    setListings((data as Listing[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const updateStatus = async (id: string, status: Listing["status"]) => {
    const { error } = await supabase.from("listings").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Listing ${status}`);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Listing deleted");
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Listings</h1>
            <p className="text-sm text-muted-foreground">Sell your produce directly to buyers.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" /> New
              </Button>
            </DialogTrigger>
            <NewListingDialog onClose={() => setOpen(false)} onCreated={load} userId={user!.id} />
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : listings.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No listings yet. Create your first one!</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {listings.map((l) => (
              <Card key={l.id} className="overflow-hidden">
                <ListingImage path={l.image_url} alt={l.title} />
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{l.title}</h3>
                    <Badge variant={l.status === "active" ? "default" : "secondary"}>{l.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    R{Number(l.price_per_unit).toFixed(2)}/{l.unit} · {l.quantity_available} {l.unit} available
                  </p>
                  {l.location && <p className="text-xs text-muted-foreground">📍 {l.location}</p>}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {l.status === "active" ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(l.id, "sold")}>
                          Mark sold
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(l.id, "closed")}>
                          Close
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(l.id, "active")}>
                        Re-list
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => remove(l.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function NewListingDialog({
  onClose,
  onCreated,
  userId,
}: {
  onClose: () => void;
  onCreated: () => void;
  userId: string;
}) {
  const [title, setTitle] = useState("");
  const [crop, setCrop] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("kg");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [location, setLocation] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setFile(f);
  };

  const submit = async () => {
    if (!title.trim() || !crop.trim() || !price || !qty) {
      toast.error("Please fill in title, crop, price and quantity");
      return;
    }
    setSaving(true);
    let imagePath: string | null = null;
    if (file) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("listings").upload(path, file);
      if (upErr) {
        toast.error("Image upload failed", { description: upErr.message });
        setSaving(false);
        return;
      }
      imagePath = path;
    }
    const { error } = await supabase.from("listings").insert({
      farmer_id: userId,
      title: title.trim(),
      crop: crop.trim(),
      description: description.trim() || null,
      unit,
      price_per_unit: Number(price),
      quantity_available: Number(qty),
      location: location.trim() || null,
      image_url: imagePath,
    });
    setSaving(false);
    if (error) {
      toast.error("Could not save", { description: error.message });
      return;
    }
    toast.success("Listing created");
    onCreated();
    onClose();
  };

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>New produce listing</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Fresh tomatoes — 50kg" maxLength={120} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Crop</Label>
            <Input value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="Tomatoes" maxLength={60} />
          </div>
          <div>
            <Label>Unit</Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="bag">bag</SelectItem>
                <SelectItem value="crate">crate</SelectItem>
                <SelectItem value="bunch">bunch</SelectItem>
                <SelectItem value="litre">litre</SelectItem>
                <SelectItem value="each">each</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Price per {unit} (R)</Label>
            <Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <Label>Quantity available</Label>
            <Input type="number" min="0" step="0.01" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Location</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Pretoria, GP" maxLength={120} />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3} />
        </div>
        <div>
          <Label className="cursor-pointer">
            <div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground hover:bg-muted/50">
              <ImagePlus className="h-5 w-5" />
              {file ? file.name : "Add a photo (optional, max 5MB)"}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
          </Label>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={saving}>
          {saving ? "Saving…" : "Publish"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
