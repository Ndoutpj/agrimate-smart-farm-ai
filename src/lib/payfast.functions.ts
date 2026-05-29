import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildSignature, PAYFAST_PROCESS_URL } from "./payfast";

/**
 * Prepare a PayFast subscription checkout for the current user.
 * Returns the process URL + signed fields the client should POST as a form.
 */
export const createPayfastSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { returnOrigin: string }) => {
    if (!d?.returnOrigin || !/^https?:\/\//.test(d.returnOrigin)) {
      throw new Error("Invalid return origin");
    }
    return d;
  })
  .handler(async ({ data, context }) => {
    const merchantId = process.env.PAYFAST_MERCHANT_ID;
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
    const passphrase = process.env.PAYFAST_PASSPHRASE;
    if (!merchantId || !merchantKey) throw new Error("PayFast not configured");

    const { userId, supabase } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();

    const email = context.claims?.email as string | undefined;
    const [firstName, ...rest] = (profile?.full_name || email?.split("@")[0] || "AgriMate Farmer").split(" ");

    const origin = data.returnOrigin.replace(/\/$/, "");
    const mPaymentId = `am_${userId}_${Date.now()}`;

    // Order matters for signature generation.
    const fields: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${origin}/premium-success`,
      cancel_url: `${origin}/upgrade?cancelled=1`,
      notify_url: `${origin}/api/payfast/notify`,
      name_first: firstName || "AgriMate",
      name_last: rest.join(" ") || "Farmer",
      email_address: email || "",
      m_payment_id: mPaymentId,
      amount: "49.00",
      item_name: "AgriMate Premium",
      item_description: "Monthly subscription — unlock everything in AgriMate.",
      custom_str1: userId, // we use this in the ITN to identify the user
      subscription_type: "1",
      billing_date: new Date().toISOString().slice(0, 10),
      recurring_amount: "49.00",
      frequency: "3", // 3 = monthly
      cycles: "0", // 0 = indefinite
    };

    const signature = buildSignature(fields, passphrase);

    return {
      action: PAYFAST_PROCESS_URL,
      fields: { ...fields, signature },
    };
  });

/** Cancel current premium plan (stops gating). */
export const cancelPayfastSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({
        is_premium: false,
        plan: "free",
        subscription_status: "cancelled",
        subscription_cancelled_at: new Date().toISOString(),
        next_billing_date: null,
      })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
