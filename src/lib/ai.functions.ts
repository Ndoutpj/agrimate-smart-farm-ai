import { createServerFn } from "@tanstack/react-start";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callAI(body: unknown) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (res.status === 429) throw new Error("Rate limit reached. Please try again in a moment.");
  if (res.status === 402) throw new Error("AI credits depleted. Please add credits in Workspace settings.");
  if (!res.ok) {
    const t = await res.text();
    console.error("AI error", res.status, t);
    throw new Error("AI service error");
  }
  return res.json();
}

/** Diagnose crop disease from an uploaded leaf photo (base64 data URL). */
export const diagnoseCrop = createServerFn({ method: "POST" })
  .inputValidator((d: { imageDataUrl: string; crop?: string; notes?: string }) => {
    if (!d?.imageDataUrl?.startsWith("data:image/")) throw new Error("Invalid image data");
    if (d.imageDataUrl.length > 8_000_000) throw new Error("Image too large (max ~6MB)");
    return d;
  })
  .handler(async ({ data }) => {
    const sys = `You are AgriMate Crop Doctor, an expert plant pathologist for African smallholder farmers.
Analyze the leaf/plant photo and return a clear, friendly diagnosis a farmer can act on today.
Use simple language. Always include practical organic AND chemical options where appropriate.`;

    const userText = `Crop (if known): ${data.crop || "unknown"}
Farmer notes: ${data.notes || "none"}

Please respond in this exact markdown structure:

### 🔬 Diagnosis
(Likely disease/pest name + confidence as Low/Medium/High)

### 🌱 What you're seeing
(2-3 lines describing symptoms visible in the image)

### ⚡ Immediate actions (next 24-48h)
- bullet steps

### 🛡️ Treatment options
**Organic:** ...
**Chemical:** ...

### 🌾 Prevention
- bullet tips

### ⚠️ When to call an agronomist
(one line)`;

    const json = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: sys },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            { type: "image_url", image_url: { url: data.imageDataUrl } },
          ],
        },
      ],
    });
    const text = json?.choices?.[0]?.message?.content ?? "No response.";
    return { text };
  });

/** Answer a farming question. messages = full chat history. */
export const askFarmer = createServerFn({ method: "POST" })
  .inputValidator((d: { messages: { role: "user" | "assistant"; content: string }[] }) => {
    if (!Array.isArray(d?.messages) || d.messages.length === 0) throw new Error("messages required");
    if (d.messages.length > 30) throw new Error("Conversation too long");
    for (const m of d.messages) {
      if (typeof m.content !== "string" || m.content.length > 4000) throw new Error("invalid message");
    }
    return d;
  })
  .handler(async ({ data }) => {
    const sys = `You are AgriMate Assistant, a friendly farming expert helping African smallholder farmers.
- Give concise, practical answers (max ~250 words).
- Use metric units, ZAR currency where money is involved.
- Cover crops, soil, irrigation, pests, weather, markets, livestock basics.
- If asked something outside farming, gently redirect.
- Format with short paragraphs and bullets when helpful.`;
    const json = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: sys }, ...data.messages],
    });
    const text = json?.choices?.[0]?.message?.content ?? "Sorry, I couldn't answer that.";
    return { text };
  });
