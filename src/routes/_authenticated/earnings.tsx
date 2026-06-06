import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/earnings")({
  component: () => (
    <ComingSoon
      title="Earnings"
      description="Per-job and monthly earnings tracker for service providers."
      phase="Coming in Phase 3"
    />
  ),
});
