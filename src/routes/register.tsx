import { createFileRoute } from "@tanstack/react-router";
import { AuthShell } from "@/components/AuthShell";

export const Route = createFileRoute("/register")({
  component: () => (
    <AuthShell
      mode="register"
      title="Create your account"
      subtitle="Start planning smarter farming in under a minute."
      perks={[
        "Free Farm Planning Calculator",
        "AI insights tuned to your crops",
        "Upgrade to Premium anytime",
      ]}
    />
  ),
  head: () => ({
    meta: [
      { title: "Create account — AgriMate" },
      { name: "description", content: "Join AgriMate and farm smarter today." },
    ],
  }),
});
