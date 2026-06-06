/**
 * Socket.IO singleton client.
 * Connects to the SIGMA Go server. Opt-in via VITE_GO_API_URL.
 *
 * Usage:
 *   const socket = await getSocket();
 *   socket.emit("join", "clan:abc");
 *   socket.on("message", (m) => ...);
 */
import { io, type Socket } from "socket.io-client";
import { supabase } from "@/integrations/supabase/client";

const GO_API_URL = import.meta.env.VITE_GO_API_URL as string | undefined;

let socket: Socket | null = null;
let connecting: Promise<Socket | null> | null = null;

export async function getSocket(): Promise<Socket | null> {
  if (!GO_API_URL) return null;
  if (socket?.connected) return socket;
  if (connecting) return connecting;

  connecting = (async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return null;
    socket = io(GO_API_URL, {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      query: { token },
    });
    socket.on("connect_error", (err) => console.warn("[socket] connect_error", err.message));
    return socket;
  })();

  try {
    return await connecting;
  } finally {
    connecting = null;
  }
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
