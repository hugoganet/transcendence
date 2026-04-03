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
    <div style={{ position: "fixed", bottom: 20, right: 20, width: 300, border: "1px solid #ccc", background: "white", borderRadius: 8, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>{t("chat.title")}</strong>
        <button onClick={onClose}>✕</button>
      </div>

      <div style={{ height: "40vh", overflowY: "auto", margin: "8px 0", display: "flex", flexDirection: "column", gap: 4 }}>
        {messages.map((m) => {
          const isMine = m.senderId === user?.id;
          return (
            <div key={m.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}>
              <span style={{ maxWidth: "70%", padding: "4px 8px", border: "1px solid #ccc", borderRadius: 8, fontSize: "0.85rem" }}>
                {m.content}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 4 }}>
        <input maxLength={100} value={input} onChange={(e) => setInput(e.target.value)} style={{ flex: 1, border: "1px solid #ccc", borderRadius: 4, padding: 4 }} />
        <button onClick={handleSend}>{t("chat.send")}</button>
        </div>
    </div>
  );
}