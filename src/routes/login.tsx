import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "@/components/AuthShell";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Sign in — AgriMate" },
      { name: "description", content: "Sign in to your AgriMate account to manage your farm." },
    ],
  }),
});

function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to keep your fields thriving."
      submitLabel="Sign in"
      fields={[
        { name: "email", label: "Email", type: "email", placeholder: "you@farm.co" },
        { name: "password", label: "Password", type: "password", placeholder: "••••••••" },
      ]}
      perks={[
        "Plan crops, water and budget in one place",
        "AI crop doctor in your pocket",
        "Weather alerts tuned to your region",
      ]}
      footer={
        <div className="flex items-center justify-between">
          <Link to="/register" className="text-primary hover:underline">
            Create an account
          </Link>
          <a href="#" className="hover:text-foreground">Forgot password?</a>
        </div>
      }
    />
  );
}
