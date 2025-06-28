import { io, Socket } from "socket.io-client";

import { ChatMessage } from "@/types";

class ChatService {
  private socket: Socket | null = null;

  connect(channelId: string, token: string) {
    const WS_URL = process.env.NEXT_PUBLIC_CHAT_WS_URL || "ws://localhost:3006";

    this.socket = io(WS_URL, {
      auth: {
        token,
      },
      query: {
        channelId,
      },
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendMessage(message: string) {
    if (this.socket) {
      this.socket.emit("chat:message", { message });
    }
  }

  onMessage(callback: (message: ChatMessage) => void) {
    if (this.socket) {
      this.socket.on("chat:message", callback);
    }
  }

  onUserJoin(callback: (user: any) => void) {
    if (this.socket) {
      this.socket.on("chat:user_join", callback);
    }
  }

  onUserLeave(callback: (user: any) => void) {
    if (this.socket) {
      this.socket.on("chat:user_leave", callback);
    }
  }

  onConnect(callback: () => void) {
    if (this.socket) {
      this.socket.on("connect", callback);
    }
  }

  onDisconnect(callback: () => void) {
    if (this.socket) {
      this.socket.on("disconnect", callback);
    }
  }

  onError(callback: (error: any) => void) {
    if (this.socket) {
      this.socket.on("error", callback);
    }
  }

  isConnected(): boolean {
    return this.socket ? this.socket.connected : false;
  }
}

export const chatService = new ChatService();
