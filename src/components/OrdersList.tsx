import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Star } from "lucide-react";
import { OrderChat } from "@/components/OrderChat";
import { RateOrderDialog } from "@/components/RateOrderDialog";
import { toast } from "sonner";

type Order = {
  id: string;
  listing_id: string;
  buyer_id: string;
  farmer_id: string;
  quantity: number;
  total_price: number;
  contact_phone: string | null;
  notes: string | null;
  status: "pending" | "accepted" | "declined" | "completed" | "cancelled";
  created_at: string;
  listings?: { title: string; unit: string } | null;
};

const STATUS_COLORS: Record<Order["status"], "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  accepted: "default",
  declined: "destructive",
  completed: "secondary",
  cancelled: "destructive",
};

export function OrdersList({
  userId,
  mode,
}: {
  userId: string;
  mode: "active" | "history";
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [rating, setRating] = useState<Order | null>(null);
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    const statuses = mode === "active" ? ["pending", "accepted"] : ["completed", "declined", "cancelled"];
    const { data } = await supabase
      .from("orders")
      .select("*, listings(title, unit)")
      .or(`buyer_id.eq.${userId},farmer_id.eq.${userId}`)
      .in("status", statuses)
      .order("created_at", { ascending: false });
    setOrders((data as Order[]) ?? []);

    if (mode === "history" && data?.length) {
      const { data: rated } = await supabase
        .from("ratings")
        .select("order_id")
        .eq("rater_id", userId)
        .in("order_id", data.map((o) => o.id));
      setRatedIds(new Set((rated ?? []).map((r) => r.order_id)));
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, mode]);

  const updateStatus = async (id: string, status: Order["status"]) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Order ${status}`);
    setSelected(null);
    load();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="p-12 text-center text-muted-foreground">
        {mode === "active" ? (
          <>
            No active orders.{" "}
            <Link to="/browse" className="text-primary underline">Browse the marketplace</Link>.
          </>
        ) : (
          "No past orders yet."
        )}
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {orders.map((o) => {
          const youAreBuyer = o.buyer_id === userId;
          return (
            <Card key={o.id} className="p-4 cursor-pointer hover:shadow" onClick={() => setSelected(o)}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{o.listings?.title ?? "Listing"}</p>
                  <p className="text-xs text-muted-foreground">
                    {youAreBuyer ? "Buying" : "Selling"} · {Number(o.quantity)} {o.listings?.unit ?? "unit"} · R{Number(o.total_price).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(o.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={STATUS_COLORS[o.status]}>{o.status}</Badge>
              </div>
              {mode === "history" && o.status === "completed" && !ratedIds.has(o.id) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRating(o);
                  }}
                >
                  <Star className="h-3 w-3" /> Rate
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      {selected && (
        <Dialog open onOpenChange={(v) => !v && setSelected(null)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selected.listings?.title ?? "Order"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Quantity:</span> {Number(selected.quantity)} {selected.listings?.unit}
              </p>
              <p>
                <span className="text-muted-foreground">Total:</span>{" "}
                <span className="font-bold text-primary">R{Number(selected.total_price).toFixed(2)}</span>
              </p>
              {selected.contact_phone && (
                <p>
                  <span className="text-muted-foreground">Phone:</span> {selected.contact_phone}
                </p>
              )}
              {selected.notes && (
                <p>
                  <span className="text-muted-foreground">Notes:</span> {selected.notes}
                </p>
              )}
              <p>
                <span className="text-muted-foreground">Status:</span>{" "}
                <Badge variant={STATUS_COLORS[selected.status]}>{selected.status}</Badge>
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {selected.farmer_id === userId && selected.status === "pending" && (
                <>
                  <Button size="sm" onClick={() => updateStatus(selected.id, "accepted")}>Accept</Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus(selected.id, "declined")}>Decline</Button>
                </>
              )}
              {selected.farmer_id === userId && selected.status === "accepted" && (
                <Button size="sm" onClick={() => updateStatus(selected.id, "completed")}>Mark completed</Button>
              )}
              {selected.buyer_id === userId && (selected.status === "pending" || selected.status === "accepted") && (
                <Button size="sm" variant="outline" onClick={() => updateStatus(selected.id, "cancelled")}>
                  Cancel order
                </Button>
              )}
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Messages</p>
              <OrderChat orderId={selected.id} userId={userId} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {rating && (
        <RateOrderDialog
          open
          onOpenChange={(v) => !v && setRating(null)}
          orderId={rating.id}
          raterId={userId}
          rateeId={rating.buyer_id === userId ? rating.farmer_id : rating.buyer_id}
          onRated={load}
        />
      )}
    </>
  );
}
