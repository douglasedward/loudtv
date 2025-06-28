"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Send, Settings,Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef,useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn, formatDate, generateAvatarUrl } from "@/lib/utils";
import { type ChatMessageForm,chatMessageSchema } from "@/lib/validations";
import { chatService } from "@/services/chat.service";
import { useAuthStore,useChatStore } from "@/store";
import { ChatMessage } from "@/types";

interface ChatProps {
  channelId: string;
  className?: string;
  viewerCount?: number;
}

export function Chat({ channelId, className, viewerCount = 0 }: ChatProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isConnected,
    isChatVisible,
    addMessage,
    setConnected,
    setChatVisible,
  } = useChatStore();
  const { token, isAuthenticated } = useAuthStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChatMessageForm>({
    resolver: zodResolver(chatMessageSchema),
  });

  useEffect(() => {
    if (!channelId || !token || !isAuthenticated) return;

    setIsConnecting(true);
    chatService.connect(channelId, token);

    chatService.onConnect(() => {
      setConnected(true);
      setIsConnecting(false);
    });

    chatService.onDisconnect(() => {
      setConnected(false);
      setIsConnecting(false);
    });

    chatService.onMessage((message: ChatMessage) => {
      addMessage(message);
    });

    chatService.onError((error) => {
      console.error("Chat error:", error);
      setIsConnecting(false);
    });

    return () => {
      chatService.disconnect();
      setConnected(false);
    };
  }, [channelId, token, isAuthenticated, addMessage, setConnected]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onSubmit = (data: ChatMessageForm) => {
    if (!isConnected || !data.message.trim()) return;

    chatService.sendMessage(data.message.trim());
    reset();
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  if (!isChatVisible) {
    return (
      <Button
        onClick={() => setChatVisible(true)}
        className="fixed bottom-4 right-4 z-50"
        size="lg"
      >
        <Users className="w-5 h-5 mr-2" />
        Show Chat
      </Button>
    );
  }

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Stream Chat
            {viewerCount > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({viewerCount} viewers)
              </span>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                isConnected
                  ? "bg-green-500"
                  : isConnecting
                  ? "bg-yellow-500"
                  : "bg-red-500"
              )}
            />
            <Button
              onClick={() => setChatVisible(false)}
              size="icon"
              variant="ghost"
              className="h-8 w-8"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-4 space-y-3 max-h-96">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Welcome to the chat!</p>
              <p className="text-sm">Be the first to say something.</p>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessageItem key={message.id} message={message} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {isAuthenticated ? (
          <form onSubmit={handleSubmit(onSubmit)} className="p-4 border-t">
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  {...register("message")}
                  ref={inputRef}
                  placeholder={
                    isConnected
                      ? "Type a message..."
                      : isConnecting
                      ? "Connecting..."
                      : "Disconnected"
                  }
                  disabled={!isConnected}
                  onKeyPress={handleKeyPress}
                  error={errors.message?.message}
                  className="resize-none"
                />
              </div>
              <Button type="submit" size="icon" disabled={!isConnected}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        ) : (
          <div className="p-4 border-t text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Log in to participate in chat
            </p>
            <Link href="/auth/login">
              <Button size="sm">Log In</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ChatMessageItemProps {
  message: ChatMessage;
}

function ChatMessageItem({ message }: ChatMessageItemProps) {
  return (
    <div className="flex space-x-3 group">
      <img
        src={generateAvatarUrl(message.username)}
        alt={message.username}
        className="w-8 h-8 rounded-full flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline space-x-2">
          <span className="font-medium text-sm truncate">
            {message.username}
          </span>
          {message.badges?.map((badge) => (
            <span
              key={badge}
              className="inline-block px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded"
            >
              {badge}
            </span>
          ))}
          <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            {formatDate(message.timestamp)}
          </span>
        </div>
        <p className="text-sm mt-1 break-words">{message.message}</p>
      </div>
    </div>
  );
}
