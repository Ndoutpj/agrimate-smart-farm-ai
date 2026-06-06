import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/bookings")({
  component: () => (
    <ComingSoon
      title="Bookings"
      description="Incoming requests from farmers — accept, decline, manage your schedule."
      phase="Coming in Phase 3"
    />
  ),
});
