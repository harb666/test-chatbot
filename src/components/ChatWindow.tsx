import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../lib/personality";

const QUICK_REPLIES = ["Got any treats? 🐟", "Who's Biscuit?", "You're a good boy", "Pet Oreo", "No treats right now"];

interface Props {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  typing: boolean;
}

export default function ChatWindow({ messages, onSend, typing }: Props) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setDraft("");
  };

  return (
    <div className="chat-window">
      <div className="chat-list" ref={listRef}>
        {messages.map((m) => (
          <div key={m.id} className={`bubble-row ${m.speaker}`}>
            {m.speaker !== "user" && m.speaker !== "system" && (
              <span className="bubble-label">{m.speaker === "oreo" ? "Oreo 🐾" : "Biscuit"}</span>
            )}
            <div className={`bubble ${m.speaker}`}>{m.text}</div>
          </div>
        ))}
        {typing && (
          <div className="bubble-row oreo">
            <span className="bubble-label">Oreo 🐾</span>
            <div className="bubble oreo typing">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        )}
      </div>

      <div className="quick-replies">
        {QUICK_REPLIES.map((q) => (
          <button key={q} className="chip" onClick={() => submit(q)}>
            {q}
          </button>
        ))}
      </div>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          submit(draft);
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Say something to Oreo…"
          aria-label="Message"
          autoComplete="off"
        />
        <button type="submit" aria-label="Send">
          ➤
        </button>
      </form>
    </div>
  );
}
