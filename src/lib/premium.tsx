import { createContext, useContext, type ReactNode } from "react";

// Subscriptions are disabled — everything is unlocked for all users.
type PremiumState = {
  isPremium: boolean;
  plan: string;
  loading: boolean;
  nextBillingDate: string | null;
  subscriptionStatus: string | null;
  refresh: () => Promise<void>;
  openUpgrade: (feature?: string) => void;
};

const Ctx = createContext<PremiumState>({
  isPremium: true,
  plan: "free",
  loading: false,
  nextBillingDate: null,
  subscriptionStatus: null,
  refresh: async () => {},
  openUpgrade: () => {},
});

export const usePremium = () => useContext(Ctx);

export function PremiumProvider({ children }: { children: ReactNode }) {
  return (
    <Ctx.Provider
      value={{
        isPremium: true,
        plan: "free",
        loading: false,
        nextBillingDate: null,
        subscriptionStatus: null,
        refresh: async () => {},
        openUpgrade: () => {},
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function LockBadge({ className = "" }: { className?: string }) {
  return <span className={className} />;
}

export function PremiumGate({ children }: { children: ReactNode; feature?: string; className?: string }) {
  return <>{children}</>;
}
