import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/orders")({
  component: () => (
    <ComingSoon title="Active Orders" description="Track your active produce orders here." phase="Coming in Phase 2" />
  ),
});
