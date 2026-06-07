import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { OrdersList } from "@/components/OrdersList";

export const Route = createFileRoute("/_authenticated/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-bold">Order history</h1>
        <p className="mb-6 text-sm text-muted-foreground">Completed, declined and cancelled orders.</p>
        <OrdersList userId={user.id} mode="history" />
      </main>
    </div>
  );
}
