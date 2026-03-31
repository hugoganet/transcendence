import { useState, useEffect } from "react";

type Message = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
};

type Props = {
  userId: string;
  onClose: () => void;
};

export function ChatBox({ userId, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    fetch(`/api/v1/messages/${userId}`, { credentials: "include" })
      .then((res) => res.json())
      .then((body) => setMessages(body.data));
  }, [userId]);
  
  const handleSend = async () => {
    if (!input.trim()) return;
    await fetch("/api/v1/messages", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: userId, content: input }),
    });
    setInput("");
    fetch(`/api/v1/messages/${userId}`, { credentials: "include" })
      .then((res) => res.json())
      .then((body) => setMessages(body.data));
  };


  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, width: 300, border: "1px solid #ccc", background: "white", borderRadius: 8, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>Chat</strong>
        <button onClick={onClose}>✕</button>
      </div>

      <div style={{ height: 200, overflowY: "auto", margin: "8px 0" }}>
        {messages.map((m) => (
          <div key={m.id}>{m.content}</div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} style={{ flex: 1, border: "1px solid #ccc", borderRadius: 4, padding: 4 }} />
        <button onClick={handleSend}>Send</button> 
        </div>
    </div>
  );
}