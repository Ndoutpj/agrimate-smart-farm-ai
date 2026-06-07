import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { OrdersList } from "@/components/OrdersList";

export const Route = createFileRoute("/_authenticated/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-bold">Active orders</h1>
        <p className="mb-6 text-sm text-muted-foreground">Track your pending and accepted orders.</p>
        <OrdersList userId={user.id} mode="active" />
      </main>
    </div>
  );
}
