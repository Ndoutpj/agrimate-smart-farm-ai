import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "@/components/AuthShell";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  head: () => ({
    meta: [
      { title: "Create account — AgriMate" },
      { name: "description", content: "Join AgriMate and start farming smarter today." },
    ],
  }),
});

function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start planning smarter farming in under a minute."
      submitLabel="Create account"
      fields={[
        { name: "name", label: "Full name", placeholder: "Tshifhiwa Junior" },
        { name: "email", label: "Email", type: "email", placeholder: "you@farm.co" },
        { name: "password", label: "Password", type: "password", placeholder: "Create a strong password" },
      ]}
      perks={[
        "Free Farm Planning Calculator",
        "AI insights tuned to your crops",
        "Upgrade to Premium anytime — R49/month",
      ]}
      footer={
        <span>
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </span>
      }
    />
  );
}
