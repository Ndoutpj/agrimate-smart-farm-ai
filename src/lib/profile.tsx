import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type AccountType = "farmer" | "buyer" | "service_provider";
export type VerificationStatus = "unverified" | "pending" | "verified";

export type ProfileRow = {
  id: string;
  full_name: string | null;
  account_type: AccountType;
  is_service_provider_enabled: boolean;
  verification_status: VerificationStatus;
  is_premium: boolean;
};

type Ctx = {
  profile: ProfileRow | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const ProfileCtx = createContext<Ctx>({ profile: null, loading: true, refresh: async () => {} });
export const useProfile = () => useContext(ProfileCtx);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, account_type, is_service_provider_enabled, verification_status, is_premium")
      .eq("id", user.id)
      .maybeSingle();
    setProfile((data as ProfileRow | null) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <ProfileCtx.Provider value={{ profile, loading, refresh: load }}>
      {children}
    </ProfileCtx.Provider>
  );
}
