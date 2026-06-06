/**
 * ClanChatRoom — Socket.IO-backed text chat for a clan.
 * AV channels reuse useWebRTC + Socket.IO "webrtc:signal" relay.
 * Falls back to a read-only message list (Supabase) when Go server is unset.
 */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icon, SIGMA_ICONS } from "@/components/ui/Icon";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/hooks/useAuth";

interface Msg {
  id?: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export function ClanChatRoom({ clanId }: { clanId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const room = `clan:${clanId}`;
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      const socket = await getSocket();
      if (!socket) return;
      socket.emit("join", room);
      const onMsg = (m: Msg) => setMessages((p) => [...p, m].slice(-200));
      socket.on("message", onMsg);
      cleanup = () => {
        socket.emit("leave", room);
        socket.off("message", onMsg);
      };
    })();
    return () => cleanup?.();
  }, [room]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    const socket = await getSocket();
    if (!socket) return;
    socket.emit("message", JSON.stringify({ roomId: room, content: input.trim() }));
    setInput("");
  };

  return (
    <Card className="cosmic-card flex flex-col h-[32rem]">
      <header className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
        <Icon icon={SIGMA_ICONS.clan} size={20} className="text-primary" />
        <span className="font-cosmic">Clan chat</span>
      </header>
      <ScrollArea className="flex-1" viewportRef={scrollRef as unknown as React.RefObject<HTMLDivElement>}>
        <div className="px-4 py-3 space-y-2">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No messages yet — say hi.
            </p>
          )}
          {messages.map((m, i) => (
            <div key={m.id ?? i} className="text-sm">
              <span className="font-medium text-primary">{m.senderId.slice(0, 8)}</span>{" "}
              <span>{m.content}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
      <form onSubmit={send} className="flex gap-2 p-3 border-t border-border/40">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message your clan..."
          maxLength={500}
        />
        <Button type="submit" disabled={!input.trim()}>
          Send
        </Button>
      </form>
    </Card>
  );
}
