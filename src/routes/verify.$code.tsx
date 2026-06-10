import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/verify/$code")({
  component: VerifyPage,
  head: ({ params }) => ({
    meta: [
      { title: `Verify certificate ${params.code} — AgriMate` },
      { name: "description", content: "Verify the authenticity of an AgriMate course certificate." },
    ],
  }),
});

type Result = {
  ok: boolean;
  name?: string;
  courseTitle?: string;
  completedAt?: string;
};

function VerifyPage() {
  const { code } = Route.useParams();
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("course_progress")
        .select("user_full_name, completed_at, course:courses(title)")
        .eq("certificate_code", code)
        .eq("completed", true)
        .maybeSingle();
      if (!data) return setResult({ ok: false });
      const courseRel = data.course as { title?: string } | { title?: string }[] | null;
      const courseTitle = Array.isArray(courseRel) ? courseRel[0]?.title : courseRel?.title;
      setResult({
        ok: true,
        name: (data.user_full_name as string | null) ?? "AgriMate Farmer",
        courseTitle: courseTitle ?? "Course",
        completedAt: data.completed_at as string,
      });
    })();
  }, [code]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-2 px-4">
          <Logo />
          <span className="text-lg font-semibold">Agri<span className="text-primary">Mate</span></span>
        </div>
      </header>
      <div className="mx-auto max-w-xl px-4 py-12 animate-fade-up">
        <Card className="p-8 text-center">
          {!result ? (
            <div className="flex items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying…</div>
          ) : result.ok ? (
            <>
              <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold">Certificate is authentic</h1>
              <Award className="mx-auto my-4 h-8 w-8 text-primary" />
              <div className="space-y-1">
                <p className="text-lg font-semibold">{result.name}</p>
                <p className="text-sm text-muted-foreground">completed</p>
                <p className="text-base font-medium">{result.courseTitle}</p>
                <p className="text-xs text-muted-foreground">
                  on {result.completedAt ? new Date(result.completedAt).toLocaleDateString() : "—"}
                </p>
                <p className="pt-3 text-xs text-muted-foreground">Certificate ID: {code}</p>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <XCircle className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold">Not found</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                No valid AgriMate certificate matches code <span className="font-mono">{code}</span>.
              </p>
            </>
          )}
          <Link to="/" className="mt-6 inline-block">
            <Button variant="outline">Go to AgriMate</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
