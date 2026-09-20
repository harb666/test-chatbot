import { useEffect, useRef, useState } from "react";
import Scene from "./components/Scene";
import ChatWindow from "./components/ChatWindow";
import { respondTo, hungerNudge, type ChatMessage, type Mood } from "./lib/personality";

const WELCOME: ChatMessage[] = [
  {
    id: "welcome",
    speaker: "oreo",
    text: "Hi! I'm Oreo — black and white, very dashing white-tipped tail, extremely hungry. Talk to me, but be warned: I will bring it back around to snacks.",
  },
];

function useShare() {
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const share = async () => {
    const url = window.location.href;
    const data = {
      title: "Chat with Oreo 🐾",
      text: "This cat will absolutely beg you for treats. His sister Biscuit hates humans. No sign-up needed.",
      url,
    };
    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch {
        /* user cancelled — fine */
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return { canShare, copied, share };
}

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>(WELCOME);
  const [mood, setMood] = useState<Mood>("idle");
  const [hunger, setHunger] = useState(55);
  const [typing, setTyping] = useState(false);
  const hungerRef = useRef(hunger);
  const lastNudgeAt = useRef(0);
  const { canShare, copied, share } = useShare();

  useEffect(() => {
    hungerRef.current = hunger;
  }, [hunger]);

  // Oreo is greedy: he gets hungrier on his own over time.
  useEffect(() => {
    const id = setInterval(() => {
      setHunger((h) => Math.min(100, h + 3));
    }, 8000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (hunger < 85) return;
    const now = Date.now();
    if (now - lastNudgeAt.current < 15000) return;
    const nudge = hungerNudge(hunger);
    if (nudge) {
      lastNudgeAt.current = now;
      setTyping(true);
      const delay = 700 + Math.random() * 500;
      setTimeout(() => {
        setTyping(false);
        setMessages((prev) => [...prev, nudge]);
        setMood("alert");
      }, delay);
    }
  }, [hunger]);

  const handleSend = (text: string) => {
    const userMsg: ChatMessage = { id: `u${Date.now()}`, speaker: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setTyping(true);

    const delay = 500 + Math.random() * 700;
    setTimeout(() => {
      const result = respondTo(text, hungerRef.current);
      setTyping(false);
      setMessages((prev) => [...prev, ...result.messages]);
      setMood(result.mood);
      setHunger((h) => Math.max(0, Math.min(100, h + result.hungerDelta)));
      setTimeout(() => setMood("idle"), 3200);
    }, delay);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="title-block">
          <h1>Oreo 🐾</h1>
          <p>black &amp; white · white-tipped tail · professionally greedy</p>
        </div>
        <button className="share-btn" onClick={share}>
          {copied ? "Link copied!" : canShare ? "Send via iMessage" : "Copy link"}
        </button>
      </header>

      <div className="scene-wrap">
        <Scene mood={mood} />
        <div className="hunger-meter" title="Oreo's Treat Meter">
          <span className="hunger-label">Treat Meter</span>
          <div className="hunger-track">
            <div className="hunger-fill" style={{ width: `${hunger}%` }} />
          </div>
        </div>
      </div>

      <ChatWindow messages={messages} onSend={handleSend} typing={typing} />

      <footer className="app-footer">
        No account, no API key, nothing to install — this whole chat runs on your device. Just share the link.{" "}
        <a href="./flybrain.html">🪰 Or try the Fly Brain</a>
      </footer>
    </div>
  );
}
