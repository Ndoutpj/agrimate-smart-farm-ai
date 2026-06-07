import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function RateOrderDialog({
  open,
  onOpenChange,
  orderId,
  raterId,
  rateeId,
  onRated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orderId: string;
  raterId: string;
  rateeId: string;
  onRated?: () => void;
}) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    const { error } = await supabase.from("ratings").upsert(
      { order_id: orderId, rater_id: raterId, ratee_id: rateeId, stars, comment: comment.trim() || null },
      { onConflict: "order_id,rater_id" },
    );
    setSaving(false);
    if (error) {
      toast.error("Could not save rating", { description: error.message });
      return;
    }
    toast.success("Thanks for your feedback!");
    onOpenChange(false);
    onRated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate this order</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center gap-1 py-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setStars(n)} aria-label={`${n} stars`}>
              <Star
                className={`h-8 w-8 ${n <= stars ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
              />
            </button>
          ))}
        </div>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Leave a comment (optional)"
          maxLength={500}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Submit rating"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
