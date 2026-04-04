/**
 * @file ChatBox — real-time messaging component with Socket.IO.
 * FR: ChatBox — composant de messagerie temps réel avec Socket.IO.
 */
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { getSocket } from "../api/socket.js";
import { useAuth } from "../contexts/AuthContext.js";

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
};

type Props = {
  userId: string;
  onClose: () => void;
};

/**
 * Floating chat window that sends and receives messages in real time via Socket.IO.
 * FR: Fenêtre de chat flottante qui envoie et reçoit des messages en temps réel via Socket.IO.
 */
export function ChatBox({ userId, onClose }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    fetch(`/api/v1/messages/${userId}`, { credentials: "include" })
      .then((res) => res.json())
      .then((body) => setMessages(body.data));
  }, [userId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (msg: Message) => {
      const isThisConversation =
        msg.senderId === userId || msg.receiverId === userId;
      if (isThisConversation) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    socket.on("message:new", handler);
    return () => { socket.off("message:new", handler); };
  }, [userId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setInput("");
    await fetch("/api/v1/messages", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: userId, content: input }),
    });
  };

  /* Portal to body: AppLayout's main uses transform (animate-fade-in-up), which breaks viewport-fixed for descendants. */
  return createPortal(
    <div className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] left-[max(0.75rem,env(safe-area-inset-left,0px))] right-[max(0.75rem,env(safe-area-inset-right,0px))] z-[100] box-border flex h-[min(50dvh,calc(100dvh-1.5rem))] max-h-[calc(100dvh-1.5rem)] min-h-0 w-auto flex-col rounded-lg border border-gray-200 bg-white shadow-lg dark:border-warm-700 dark:bg-warm-800 sm:bottom-5 sm:left-auto sm:right-5 sm:h-[min(50dvh,calc(100vh-2.5rem))] sm:max-h-[calc(100vh-2.5rem)] sm:w-[min(50vw,36rem)] sm:max-w-[calc(100vw-2.5rem)]">
      <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-2 py-2 sm:px-3 dark:border-warm-700">
        <strong className="text-sm font-semibold text-gray-900 dark:text-warm-50">{t("chat.title")}</strong>
        <button
          type="button"
          onClick={onClose}
          className="text-base leading-none text-gray-400 hover:text-gray-600 dark:text-warm-300 dark:hover:text-warm-100"
        >
          ✕
        </button>
      </div>

      <div
        ref={scrollAreaRef}
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain p-2 sm:p-3"
      >
        {messages.map((m) => {
          const isMine = m.senderId === user?.id;
          return (
            <div
              key={m.id}
              className={`flex min-w-0 ${isMine ? "justify-end" : "justify-start"}`}
            >
              <span
                className="inline-block max-w-[min(92%,28rem)] min-w-0 break-words rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm leading-snug text-gray-900 [overflow-wrap:anywhere] dark:border-warm-700 dark:bg-warm-700 dark:text-warm-50 sm:max-w-[min(85%,32rem)]"
              >
                {m.content}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex min-h-0 shrink-0 gap-1.5 border-t border-gray-100 px-2 py-2 sm:gap-2 sm:px-3 dark:border-warm-700">
        <input
          maxLength={2000}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="min-w-0 flex-1 rounded border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary dark:border-warm-700 dark:bg-warm-800 dark:text-warm-50"
        />
        <button
          type="button"
          onClick={handleSend}
          className="shrink-0 rounded bg-primary px-2 py-1.5 text-xs font-medium text-white hover:bg-primary/90 sm:px-3 sm:text-sm"
        >
          {t("chat.send")}
        </button>
      </div>
    </div>,
    document.body,
  );
}
