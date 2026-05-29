// PayFast helpers — pure JS (safe for both server fns and server routes).
// Docs: https://developers.payfast.co.za/docs#step_1_form_fields
import { createHash } from "crypto";

export const PAYFAST_PROCESS_URL = "https://www.payfast.co.za/eng/process";
export const PAYFAST_VALIDATE_URL = "https://www.payfast.co.za/eng/query/validate";

/** PHP-style urlencode: spaces become `+`, matching PayFast's signature spec. */
function pfEncode(v: string): string {
  return encodeURIComponent(v).replace(/%20/g, "+");
}

/**
 * Build the MD5 signature for a PayFast form payload.
 * - Fields are concatenated in the ORDER PROVIDED (don't sort).
 * - Empty values are skipped.
 * - Passphrase (if set) is appended last as `passphrase=...`.
 */
export function buildSignature(
  fields: Record<string, string | number | undefined>,
  passphrase?: string,
): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null) continue;
    const s = String(v);
    if (s === "") continue;
    parts.push(`${k}=${pfEncode(s)}`);
  }
  if (passphrase && passphrase.trim() !== "") {
    parts.push(`passphrase=${pfEncode(passphrase.trim())}`);
  }
  return createHash("md5").update(parts.join("&")).digest("hex");
}

/**
 * Verify an ITN payload signature. Receives an already-parsed object of
 * fields posted by PayFast. We must rebuild the signature using the SAME
 * field order PayFast posted them in (use the raw body's order, not Object
 * iteration of a re-built map). Caller is responsible for preserving order.
 */
export function verifyItnSignature(
  orderedFields: Array<[string, string]>,
  passphrase: string | undefined,
  receivedSignature: string,
): boolean {
  const parts: string[] = [];
  for (const [k, v] of orderedFields) {
    if (k === "signature") continue;
    if (v === "") continue;
    parts.push(`${k}=${pfEncode(v)}`);
  }
  if (passphrase && passphrase.trim() !== "") {
    parts.push(`passphrase=${pfEncode(passphrase.trim())}`);
  }
  const expected = createHash("md5").update(parts.join("&")).digest("hex");
  return expected.toLowerCase() === receivedSignature.toLowerCase();
}

/** Parse a raw urlencoded body into ordered [key, value] tuples. */
export function parseFormBodyOrdered(body: string): Array<[string, string]> {
  return body
    .split("&")
    .filter(Boolean)
    .map((kv) => {
      const i = kv.indexOf("=");
      const k = i === -1 ? kv : kv.slice(0, i);
      const v = i === -1 ? "" : kv.slice(i + 1);
      return [decodeURIComponent(k.replace(/\+/g, " ")), decodeURIComponent(v.replace(/\+/g, " "))] as [string, string];
    });
}
