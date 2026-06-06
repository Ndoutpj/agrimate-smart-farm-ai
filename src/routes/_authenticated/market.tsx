import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/market")({
  component: () => (
    <ComingSoon
      title="Produce Marketplace"
      description="Sell your crops directly to buyers. Upload photos, set prices, manage offers."
      phase="Coming in Phase 2"
    />
  ),
});
