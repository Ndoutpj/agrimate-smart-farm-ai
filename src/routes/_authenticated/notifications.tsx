import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
  head: () => ({ meta: [{ title: "Notifications — AgriMate" }] }),
});

type N = { id: string; title: string; body: string | null; link: string | null; type: string | null; read: boolean; created_at: string };

function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<N[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
    setItems((data ?? []) as N[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.id]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    load();
  };

  const clickItem = async (n: N) => {
    if (!n.read) await supabase.from("notifications").update({ read: true }).eq("id", n.id);
    if (n.link) navigate({ to: n.link as never });
    else load();
  };

  const remove = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    toast.success("Removed");
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 animate-fade-up">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary"><Bell className="h-6 w-6" /></div>
            <div>
              <h1 className="text-2xl font-bold">Notifications</h1>
              <p className="text-sm text-muted-foreground">Updates from your farm, orders, courses & grants.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={markAllRead}><CheckCheck className="mr-2 h-4 w-4" /> Mark all read</Button>
        </div>

        {loading ? (
          <div className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…</div>
        ) : items.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">No notifications yet.</Card>
        ) : (
          <div className="space-y-2">
            {items.map((n) => (
              <Card key={n.id} className={`flex items-start gap-3 p-4 ${n.read ? "" : "border-primary/40 bg-primary/5"}`}>
                <button onClick={() => clickItem(n)} className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    {!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                    <h3 className="font-medium">{n.title}</h3>
                  </div>
                  {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                </button>
                <Button variant="ghost" size="icon" onClick={() => remove(n.id)} aria-label="Remove">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
