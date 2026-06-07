import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

type Msg = { id: string; sender_id: string; body: string; created_at: string };

export function OrderChat({ orderId, userId }: { orderId: string; userId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("messages")
      .select("id,sender_id,body,created_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!cancelled && data) setMessages(data as Msg[]);
      });

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `order_id=eq.${orderId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Msg]);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    setBody("");
    const { error } = await supabase
      .from("messages")
      .insert({ order_id: orderId, sender_id: userId, body: text });
    setSending(false);
    if (error) setBody(text);
  };

  return (
    <div className="flex flex-col rounded-lg border bg-muted/30">
      <div className="max-h-64 min-h-32 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-4">No messages yet. Say hi 👋</p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === userId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-1.5 text-sm ${
                  mine ? "bg-primary text-primary-foreground" : "bg-background border"
                }`}
              >
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 border-t p-2">
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message…"
        />
        <Button size="icon" onClick={send} disabled={!body.trim() || sending}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
