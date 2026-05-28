import { createFileRoute } from "@tanstack/react-router";
import { AuthShell } from "@/components/AuthShell";

export const Route = createFileRoute("/login")({
  component: () => (
    <AuthShell
      mode="login"
      title="Welcome back"
      subtitle="Sign in to keep your fields thriving."
      perks={[
        "Plan crops, water and budget in one place",
        "AI crop doctor in your pocket",
        "Weather alerts tuned to your region",
      ]}
    />
  ),
  head: () => ({
    meta: [
      { title: "Sign in — AgriMate" },
      { name: "description", content: "Sign in to your AgriMate account." },
    ],
  }),
});
