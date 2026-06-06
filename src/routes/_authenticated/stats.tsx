import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/stats")({
  component: () => (
    <ComingSoon
      title="Crop Stats & P&L"
      description="3D animated graphs per crop, AI health scores, season-vs-season profit tracking."
      phase="Coming in Phase 4"
    />
  ),
});
