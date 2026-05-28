import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2, CalendarClock, Flag, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tasks")({
  component: TasksPage,
  head: () => ({ meta: [{ title: "Tasks — AgriMate" }] }),
});

type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  due_at: string | null;
  completed: boolean;
  carried_over: boolean;
  task_date: string;
};

const today = () => new Date().toISOString().slice(0, 10);

function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueTime, setDueTime] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    // Carry over incomplete tasks from before today
    await supabase
      .from("tasks")
      .update({ carried_over: true, task_date: today() })
      .eq("user_id", user.id)
      .eq("completed", false)
      .lt("task_date", today());

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("task_date", today())
      .order("completed", { ascending: true })
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true });
    if (error) toast.error(error.message);
    else setTasks((data ?? []) as Task[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;
    setSaving(true);
    const due_at = dueTime
      ? new Date(`${today()}T${dueTime}:00`).toISOString()
      : null;
    const { error } = await supabase.from("tasks").insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      priority,
      due_at,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    setTitle(""); setDescription(""); setDueTime(""); setPriority("medium");
    load();
  };

  const toggle = async (t: Task) => {
    const completed = !t.completed;
    setTasks((prev) => prev.map((x) => x.id === t.id ? { ...x, completed } : x));
    await supabase.from("tasks").update({ completed, completed_at: completed ? new Date().toISOString() : null }).eq("id", t.id);
  };

  const remove = async (id: string) => {
    setTasks((prev) => prev.filter((x) => x.id !== id));
    await supabase.from("tasks").delete().eq("id", id);
  };

  const open = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 animate-fade-up">
        <div>
          <h1 className="text-3xl font-bold">Daily Tasks</h1>
          <p className="text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>

        <Card className="tilt-card p-5">
          <form onSubmit={addTask} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-[1fr_160px_140px]">
              <div>
                <Label htmlFor="t-title">Task</Label>
                <Input id="t-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Irrigate maize field" required />
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as "low" | "medium" | "high")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="t-due">Due time</Label>
                <Input id="t-due" type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
              </div>
            </div>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notes (optional)" />
            <Button type="submit" disabled={saving || !title.trim()}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add task
            </Button>
          </form>
        </Card>

        {loading ? (
          <div className="text-muted-foreground"><Loader2 className="inline mr-2 h-4 w-4 animate-spin" /> Loading tasks…</div>
        ) : (
          <>
            <Section title={`Open · ${open.length}`}>
              {open.length === 0 ? (
                <p className="text-sm text-muted-foreground">All clear for today 🌱</p>
              ) : open.map((t) => <TaskRow key={t.id} t={t} onToggle={toggle} onDelete={remove} />)}
            </Section>
            {done.length > 0 && (
              <Section title={`Completed · ${done.length}`}>
                {done.map((t) => <TaskRow key={t.id} t={t} onToggle={toggle} onDelete={remove} />)}
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function TaskRow({ t, onToggle, onDelete }: { t: Task; onToggle: (t: Task) => void; onDelete: (id: string) => void }) {
  const priorityColor = t.priority === "high" ? "text-destructive" : t.priority === "medium" ? "text-primary" : "text-muted-foreground";
  return (
    <Card className="flex items-start gap-3 p-4 tilt-card">
      <Checkbox checked={t.completed} onCheckedChange={() => onToggle(t)} className="mt-1" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`font-medium ${t.completed ? "line-through text-muted-foreground" : ""}`}>{t.title}</span>
          <span className={`inline-flex items-center gap-1 text-xs ${priorityColor}`}>
            <Flag className="h-3 w-3" /> {t.priority}
          </span>
          {t.carried_over && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-600">
              <AlertCircle className="h-3 w-3" /> carried over
            </span>
          )}
          {t.due_at && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarClock className="h-3 w-3" /> {new Date(t.due_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        {t.description && <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>}
      </div>
      <Button variant="ghost" size="icon" onClick={() => onDelete(t.id)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </Card>
  );
}
