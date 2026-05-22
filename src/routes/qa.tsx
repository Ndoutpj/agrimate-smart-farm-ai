import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef, useEffect } from "react";
import { askFarmer } from "@/lib/ai.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Send, MessageCircle, Sprout } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/qa")({
  head: () => ({
    meta: [
      { title: "Ask AgriMate — Farmer Q&A" },
      { name: "description", content: "Ask our AI assistant any farming question — soil, pests, irrigation, markets, livestock." },
      { property: "og:title", content: "Ask AgriMate — Farmer Q&A" },
      { property: "og:description", content: "Your 24/7 AI farming expert." },
    ],
  }),
  component: QAPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "How do I improve clay soil for vegetables?",
  "When should I plant maize in the Free State?",
  "Best organic way to control aphids on cabbage?",
  "How much water does 1 hectare of tomatoes need per week?",
];

function QAPage() {
  const ask = useServerFn(askFarmer);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await ask({ data: { messages: next } });
      setMessages([...next, { role: "assistant", content: res.text }]);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to get answer");
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 bg-[var(--gradient-soft)]" />
        <div className="absolute -bottom-24 -left-24 -z-10 h-72 w-72 rounded-full bg-primary-glow/20 blur-3xl animate-blob" />
        <div className="mx-auto max-w-4xl px-4 py-10 text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs backdrop-blur">
            <MessageCircle className="h-3.5 w-3.5 text-primary" /> Always-on AI assistant
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Farmer <span className="text-primary">Q&amp;A</span>
          </h1>
          <p className="mt-3 text-muted-foreground">Ask anything about farming and get expert answers instantly.</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <Card className="flex h-[65vh] flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.length === 0 && (
              <div className="space-y-4 animate-fade-up">
                <div className="rounded-xl border bg-muted/40 p-4 text-sm">
                  <Sprout className="mb-2 h-5 w-5 text-primary" />
                  Hi! I'm your AgriMate assistant. Pick a question or type your own below.
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-lg border bg-card p-3 text-left text-sm transition hover:border-primary hover:shadow-md"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex animate-fade-up ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border bg-card"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border bg-card px-4 py-2.5 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-center gap-2 border-t bg-background/60 p-3 backdrop-blur"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about crops, soil, weather, markets…"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !input.trim()} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
