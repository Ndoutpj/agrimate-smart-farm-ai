import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  PAYFAST_VALIDATE_URL,
  parseFormBodyOrdered,
  verifyItnSignature,
} from "@/lib/payfast";

/**
 * PayFast ITN (Instant Transaction Notification) webhook.
 *
 * Steps:
 *  1. Parse raw urlencoded body preserving field order.
 *  2. Verify MD5 signature using PAYFAST_PASSPHRASE.
 *  3. POST the same body back to PayFast /query/validate, expect "VALID".
 *  4. Persist event + flip the user to premium / handle cancellations.
 */
export const Route = createFileRoute("/api/payfast/notify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const passphrase = process.env.PAYFAST_PASSPHRASE;
        const rawBody = await request.text();
        const ordered = parseFormBodyOrdered(rawBody);
        const map = Object.fromEntries(ordered);

        const signature = (map["signature"] || "").toLowerCase();
        if (!signature || !verifyItnSignature(ordered, passphrase, signature)) {
          console.warn("[payfast] invalid signature");
          return new Response("Invalid signature", { status: 400 });
        }

        // Re-validate with PayFast (anti-spoof).
        try {
          const validateRes = await fetch(PAYFAST_VALIDATE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: rawBody,
          });
          const txt = (await validateRes.text()).trim();
          if (txt !== "VALID") {
            console.warn("[payfast] validate returned:", txt);
            return new Response("Not valid", { status: 400 });
          }
        } catch (e) {
          console.error("[payfast] validate request failed", e);
          // Soft-fail: still log the event so we can replay manually.
        }

        const userId = map["custom_str1"] || null;
        const status = (map["payment_status"] || "").toUpperCase();
        const token = map["token"] || null;
        const nextBilling = map["billing_date"] ? new Date(map["billing_date"]) : null;
        const amount = map["amount_gross"] ? Number(map["amount_gross"]) : null;

        // Always log the event for billing history.
        await supabaseAdmin.from("payment_events").insert({
          user_id: userId,
          m_payment_id: map["m_payment_id"] || null,
          pf_payment_id: map["pf_payment_id"] || null,
          payment_status: status,
          amount_gross: amount,
          token,
          billing_date: nextBilling ? nextBilling.toISOString() : null,
          raw: map,
        });

        if (!userId) return new Response("ok", { status: 200 });

        if (status === "COMPLETE") {
          // Advance next billing by ~1 month from today (PayFast monthly subs).
          const next = new Date();
          next.setMonth(next.getMonth() + 1);

          await supabaseAdmin
            .from("profiles")
            .update({
              is_premium: true,
              plan: "premium",
              subscription_status: "active",
              payfast_token: token,
              subscription_started_at: new Date().toISOString(),
              subscription_cancelled_at: null,
              next_billing_date: next.toISOString(),
            })
            .eq("id", userId);
        } else if (status === "CANCELLED") {
          await supabaseAdmin
            .from("profiles")
            .update({
              is_premium: false,
              plan: "free",
              subscription_status: "cancelled",
              subscription_cancelled_at: new Date().toISOString(),
            })
            .eq("id", userId);
        } else if (status === "FAILED") {
          await supabaseAdmin
            .from("profiles")
            .update({ subscription_status: "failed" })
            .eq("id", userId);
        }

        return new Response("ok", { status: 200 });
      },
      // PayFast expects a 200; respond to any pre-flight GET as well.
      GET: async () => new Response("ok"),
    },
  },
});
