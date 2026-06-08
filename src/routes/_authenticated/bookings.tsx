import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useProfile } from "@/lib/profile";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";

type Booking = {
  id: string;
  service_id: string;
  farmer_id: string;
  provider_id: string;
  start_date: string;
  end_date: string | null;
  hours: number | null;
  total_price: number;
  contact_phone: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/bookings")({
  component: BookingsPage,
});

function BookingsPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const isProvider = profile?.account_type === "service_provider" || profile?.is_service_provider_enabled;

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });
    setItems((data as Booking[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Booking ${status}`);
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-bold">Bookings</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {isProvider ? "Incoming requests for your services and equipment." : "Your equipment & service bookings."}
        </p>

        {loading ? (
          <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : items.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No bookings yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((b) => {
              const mineAsProvider = b.provider_id === user!.id;
              return (
                <Card key={b.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{b.start_date}{b.end_date ? ` → ${b.end_date}` : ""}</p>
                      {b.hours && <p className="text-xs text-muted-foreground">{b.hours} hours</p>}
                    </div>
                    <Badge variant={b.status === "accepted" ? "default" : b.status === "completed" ? "secondary" : "outline"}>
                      {b.status}
                    </Badge>
                  </div>
                  <p className="text-sm">Total: <span className="font-bold text-primary">R{Number(b.total_price).toFixed(2)}</span></p>
                  {b.contact_phone && <p className="text-xs text-muted-foreground">📞 {b.contact_phone}</p>}
                  {b.notes && <p className="text-sm text-muted-foreground">{b.notes}</p>}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {mineAsProvider && b.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => updateStatus(b.id, "accepted")}>Accept</Button>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(b.id, "declined")}>Decline</Button>
                      </>
                    )}
                    {b.status === "accepted" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(b.id, "completed")}>Mark completed</Button>
                    )}
                    {!mineAsProvider && b.status === "pending" && (
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(b.id, "cancelled")}>Cancel</Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
