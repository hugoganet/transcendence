import { useState, useEffect } from "react";
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

export function ChatBox({ userId, onClose }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

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

  return (
    <div className="fixed bottom-5 right-5 z-50 w-72 rounded-lg border border-gray-200 dark:border-warm-700 bg-white dark:bg-warm-800 shadow-lg">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-warm-700 px-3 py-2">
        <strong className="text-sm font-semibold text-gray-900 dark:text-warm-50">{t("chat.title")}</strong>
        <button
          onClick={onClose}
          className="text-gray-400 dark:text-warm-300 hover:text-gray-600 dark:hover:text-warm-100 text-base leading-none"
        >
          ✕
        </button>
      </div>

      <div className="flex h-[40vh] flex-col gap-1 overflow-y-auto p-2">
        {messages.map((m) => {
          const isMine = m.senderId === user?.id;
          return (
            <div
              key={m.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <span className="max-w-[70%] rounded-lg border border-gray-200 dark:border-warm-700 bg-gray-50 dark:bg-warm-700 px-2 py-1 text-sm text-gray-900 dark:text-warm-50">
                {m.content}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 border-t border-gray-100 dark:border-warm-700 px-3 py-2">
        <input
          maxLength={100}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 rounded border border-gray-200 dark:border-warm-700 bg-white dark:bg-warm-800 px-2 py-1 text-sm text-gray-900 dark:text-warm-50 focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={handleSend}
          className="rounded bg-primary px-3 py-1 text-sm font-medium text-white hover:bg-primary/90"
        >
          {t("chat.send")}
        </button>
      </div>
    </div>
  );
}
