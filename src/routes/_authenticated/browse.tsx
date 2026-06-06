import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/browse")({
  component: () => (
    <ComingSoon
      title="Browse Produce"
      description="Find produce from verified farmers near you. Filter by crop, region, price, and quantity."
      phase="Coming in Phase 2"
    />
  ),
});
