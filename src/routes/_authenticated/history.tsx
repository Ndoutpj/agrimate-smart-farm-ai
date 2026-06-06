import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/history")({
  component: () => (
    <ComingSoon title="Order History" description="Past orders and farmer ratings." phase="Coming in Phase 2" />
  ),
});
