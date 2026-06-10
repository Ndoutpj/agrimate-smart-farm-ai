import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, Clock, Download, Loader2, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { generateCertCode, generateCertificatePdf } from "@/lib/certificate";

export const Route = createFileRoute("/_authenticated/learn/$courseId")({
  component: CourseDetail,
  head: () => ({ meta: [{ title: "Course — AgriMate" }] }),
});

type Course = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  duration_minutes: number | null;
  content: string | null;
};

type Progress = {
  id: string;
  completed: boolean;
  completed_at: string | null;
  certificate_code: string | null;
  user_full_name: string | null;
};

function CourseDetail() {
  const { courseId } = Route.useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase.from("courses").select("*").eq("id", courseId).maybeSingle(),
        user
          ? supabase.from("course_progress").select("id,completed,completed_at,certificate_code,user_full_name").eq("user_id", user.id).eq("course_id", courseId).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      setCourse(c as Course | null);
      setProgress(p as Progress | null);
      setLoading(false);
    })();
  }, [courseId, user]);

  const complete = async () => {
    if (!user || !course) return;
    setBusy(true);
    const code = generateCertCode();
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    const fullName = (profile?.full_name as string | null) ?? user.email?.split("@")[0] ?? "AgriMate Farmer";

    const { data, error } = await supabase
      .from("course_progress")
      .upsert({
        user_id: user.id,
        course_id: course.id,
        progress: 100,
        completed: true,
        completed_at: new Date().toISOString(),
        certificate_code: code,
        user_full_name: fullName,
      }, { onConflict: "user_id,course_id" })
      .select("id,completed,completed_at,certificate_code,user_full_name")
      .single();

    if (error) {
      toast.error(error.message);
      setBusy(false);
      return;
    }
    setProgress(data as Progress);
    // Notify user
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "🎓 Certificate earned",
      body: `You completed "${course.title}". Tap to download your certificate.`,
      link: `/learn/${course.id}`,
      type: "success",
    });
    toast.success("Course completed! Certificate ready to download.");
    setBusy(false);
  };

  const download = async () => {
    if (!progress?.certificate_code || !course) return;
    setBusy(true);
    try {
      await generateCertificatePdf({
        fullName: progress.user_full_name ?? "AgriMate Farmer",
        courseTitle: course.title,
        completedAt: progress.completed_at ?? new Date().toISOString(),
        code: progress.certificate_code,
        verifyUrl: `${window.location.origin}/verify/${progress.certificate_code}`,
      });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not generate PDF");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex items-center px-4 py-16 text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…</div>
      </div>
    );
  }
  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <p>Course not found.</p>
          <Link to="/learn"><Button variant="outline" className="mt-4">Back to courses</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 animate-fade-up">
        <Link to="/learn" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> All courses
        </Link>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{course.category ?? "General"}</Badge>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> {course.duration_minutes ?? 15} min
            </span>
          </div>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground">{course.description}</p>
        </div>

        <Card className="p-6">
          <article className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">
            {course.content}
          </article>
        </Card>

        {progress?.completed ? (
          <Card className="p-6 text-center">
            <Award className="mx-auto mb-2 h-10 w-10 text-primary" />
            <h2 className="text-xl font-semibold">You earned a certificate</h2>
            <p className="mt-1 text-sm text-muted-foreground">ID: {progress.certificate_code}</p>
            <Button onClick={download} disabled={busy} size="lg" className="mt-4">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Download certificate (PDF)
            </Button>
          </Card>
        ) : (
          <Button onClick={complete} disabled={busy} size="lg" className="w-full">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Mark as completed & earn certificate
          </Button>
        )}
      </div>
    </div>
  );
}
