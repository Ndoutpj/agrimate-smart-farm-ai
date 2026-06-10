import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/learn")({
  component: LearnPage,
  head: () => ({ meta: [{ title: "Courses & Certificates — AgriMate" }] }),
});

type Course = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  duration_minutes: number | null;
};

type Progress = { course_id: string; completed: boolean; progress: number };

function LearnPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase.from("courses").select("id,title,description,category,duration_minutes").eq("is_published", true).order("created_at"),
        user
          ? supabase.from("course_progress").select("course_id,completed,progress").eq("user_id", user.id)
          : Promise.resolve({ data: [] as Progress[] }),
      ]);
      setCourses((c ?? []) as Course[]);
      const map: Record<string, Progress> = {};
      (p ?? []).forEach((r: any) => { map[r.course_id] = r; });
      setProgress(map);
      setLoading(false);
    })();
  }, [user]);

  const completedCount = Object.values(progress).filter((p) => p.completed).length;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 animate-fade-up">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary"><GraduationCap className="h-6 w-6" /></div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Courses & Certificates</h1>
            <p className="text-sm text-muted-foreground">Learn modern farming, earn shareable certificates with a QR verify code.</p>
          </div>
          <Badge variant="secondary" className="shrink-0">{completedCount} earned</Badge>
        </div>

        {loading ? (
          <div className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading courses…</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {courses.map((c) => {
              const p = progress[c.id];
              return (
                <Link key={c.id} to="/learn/$courseId" params={{ courseId: c.id }}>
                  <Card className="tilt-card group h-full p-5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Badge variant="outline">{c.category ?? "General"}</Badge>
                      {p?.completed && (
                        <span className="inline-flex items-center gap-1 text-xs text-primary">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold">{c.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                    <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> {c.duration_minutes ?? 15} min
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
