import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Check, Loader2, Fingerprint } from "lucide-react";
import sideImage from "@/assets/auth-side.jpg";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

type Mode = "login" | "register";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2, "Tell us your full name").max(80),
});

export function AuthShell({
  mode,
  title,
  subtitle,
  perks,
}: {
  mode: Mode;
  title: string;
  subtitle: string;
  perks: string[];
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    const schema = mode === "register" ? registerSchema : loginSchema;
    const parsed = schema.safeParse({ name, email, password });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path.join(".")] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Account created! Check your email to confirm.");
        navigate({ to: "/login" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        // Try to remember credentials for biometric/quick sign-in
        if (remember && "credentials" in navigator && "PasswordCredential" in window) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cred = new (window as any).PasswordCredential({ id: email, password, name: email });
            await navigator.credentials.store(cred);
          } catch {/* ignore */}
        }
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/dashboard",
      });
      if (result.error) throw result.error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const onPasskeyQuickSignIn = async () => {
    if (!("credentials" in navigator)) {
      toast.error("Your browser doesn't support saved credentials");
      return;
    }
    try {
      const cred = (await navigator.credentials.get({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        password: true,
        mediation: "required",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)) as (Credential & { id?: string; password?: string }) | null;
      if (!cred || !cred.id || !cred.password) {
        toast.info("No saved credentials found yet — sign in once to enable this.");
        return;
      }
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ id: cred.id, email: cred.id, password: cred.password } as never);
      if (error) throw error;
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Quick sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative flex items-center justify-center px-6 py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl opacity-50 animate-blob"
          style={{ background: "color-mix(in oklab, var(--primary-glow) 40%, transparent)" }}
        />
        <div className="w-full max-w-md animate-fade-up">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <Logo />
            <span className="text-lg font-semibold tracking-tight">
              Agri<span className="text-primary">Mate</span>
            </span>
          </Link>

          <h1 className="mt-8 text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tshifhiwa Junior" autoComplete="name" />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@farm.co" autoComplete="username" />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete={mode === "register" ? "new-password" : "current-password"} />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            {mode === "login" && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-muted-foreground">
                  <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                  Remember me
                </label>
                <a href="#" className="text-primary hover:underline">Forgot password?</a>
              </div>
            )}

            <Button type="submit" size="lg" disabled={loading} className="w-full bg-primary hover:bg-primary/90 shadow-[var(--shadow-glow)]">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {mode === "register" ? "Create account" : "Sign in"}
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Button type="button" variant="outline" size="lg" className="w-full" onClick={onGoogle} disabled={googleLoading}>
              {googleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Continue with Google
            </Button>

            {mode === "login" && (
              <Button type="button" variant="ghost" size="lg" className="w-full" onClick={onPasskeyQuickSignIn}>
                <Fingerprint className="mr-2 h-4 w-4" />
                Use biometric / saved login
              </Button>
            )}
          </form>

          <div className="mt-6 text-sm text-muted-foreground">
            {mode === "login" ? (
              <>Don't have an account? <Link to="/register" className="text-primary hover:underline">Create one</Link></>
            ) : (
              <>Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link></>
            )}
          </div>
        </div>
      </div>

      <div className="relative hidden lg:block overflow-hidden">
        <img src={sideImage} alt="Seedling at sunrise" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(135deg, color-mix(in oklab, var(--primary) 55%, transparent), transparent 60%)" }} />
        <div className="relative z-10 flex h-full flex-col justify-end p-12 text-primary-foreground">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> AgriMate Premium
          </span>
          <h2 className="mt-4 max-w-md text-3xl font-semibold leading-tight">
            Grow more. Waste less. Decide with data.
          </h2>
          <ul className="mt-6 space-y-2 text-sm/relaxed">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                  <Check className="h-3 w-3" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
