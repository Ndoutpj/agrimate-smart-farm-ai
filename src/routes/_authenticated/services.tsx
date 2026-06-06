import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/services")({
  component: () => (
    <ComingSoon
      title="My Services"
      description="List tractors, drones, transport, irrigation. Set your service area and availability."
      phase="Coming in Phase 3"
    />
  ),
});
