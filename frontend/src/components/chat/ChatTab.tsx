"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { useFloorChat } from "@/hooks/useFloorChat";
import { useNavigationStore } from "@/stores/navigationStore";
import type { ChatMessage } from "@/types";

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-[11px] leading-relaxed ${
          isUser
            ? "bg-violet-600/20 text-violet-200"
            : "bg-slate-700/50 text-slate-200"
        }`}
      >
        {!isUser && (
          <div className="text-[9px] text-slate-400 mb-1 font-bold uppercase tracking-wider">
            {msg.sender}
          </div>
        )}
        {msg.content}
      </div>
    </div>
  );
}

interface ChatTabProps {
  floorId?: string | null;
}

export function ChatTab({ floorId: floorIdProp }: ChatTabProps = {}) {
  const navFloorId = useNavigationStore((s) => s.floorId);
  const effectiveFloorId =
    floorIdProp !== undefined ? floorIdProp : navFloorId;

  const { messages, sendMessage, isLoading } = useFloorChat(effectiveFloorId);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending || !effectiveFloorId) return;
    setInput("");
    setSending(true);
    try {
      await sendMessage(content);
    } catch {
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  if (!effectiveFloorId) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-[11px] p-4 text-center">
        Select a floor to start chatting
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-grow overflow-y-auto p-3 min-h-0">
        {isLoading && messages.length === 0 && (
          <div className="text-slate-500 text-[11px] text-center pt-6">
            Loading…
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 border-t border-slate-700 p-2 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          placeholder="Message floor boss…"
          className="flex-1 bg-slate-800 text-slate-200 text-[11px] rounded px-2 py-1.5 border border-slate-600 focus:border-violet-500 focus:outline-none placeholder-slate-500 disabled:opacity-50"
        />
        <button
          onClick={() => void handleSend()}
          disabled={!input.trim() || sending}
          className="px-3 py-1.5 text-[11px] font-bold bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
