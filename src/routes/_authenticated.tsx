import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  component: AuthGate,
});

function AuthGate() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login", search: { redirect: window.location.pathname } as never });
    }
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Checking your session…
      </div>
    );
  }
  return (
    <>
      <TaskNotifier userId={user.id} />
      <Outlet />
    </>
  );
}

function TaskNotifier({ userId }: { userId: string }) {
  const notifiedRef = useRef<Set<string>>(new Set());
  const announcedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("tasks")
        .select("id,title,due_at,carried_over")
        .eq("user_id", userId)
        .eq("task_date", today)
        .eq("completed", false);
      if (cancelled || !data) return;

      // One-time daily summary
      if (!announcedRef.current && data.length > 0) {
        announcedRef.current = true;
        const carried = data.filter((t) => t.carried_over).length;
        toast.warning(
          `You have ${data.length} incomplete task${data.length > 1 ? "s" : ""} today`,
          {
            description: carried
              ? `${carried} carried over from previous days.`
              : "Tap Tasks in your menu to review them.",
            duration: 8000,
          },
        );
      }

      // Overdue alerts (due_at passed)
      const now = Date.now();
      for (const t of data) {
        if (!t.due_at) continue;
        const due = new Date(t.due_at).getTime();
        if (due < now && !notifiedRef.current.has(t.id)) {
          notifiedRef.current.add(t.id);
          toast.error(`Overdue: ${t.title}`, {
            description: `Was due at ${new Date(t.due_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
            duration: 8000,
          });
        }
      }
    };

    // initial slight delay so the page renders first
    const t0 = setTimeout(check, 1500);
    const interval = setInterval(check, 5 * 60 * 1000); // every 5 minutes
    return () => {
      cancelled = true;
      clearTimeout(t0);
      clearInterval(interval);
    };
  }, [userId]);

  return null;
}
