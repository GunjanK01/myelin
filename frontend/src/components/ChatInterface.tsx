"use client";
import { useState, useRef, useEffect } from "react";
import { ArrowUp, Bot, Loader2 } from "lucide-react";

type Message = { role: "user" | "ai"; content: string };

export default function ChatInterface() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Document loaded successfully! What would you like to know?" }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => scrollToBottom(), [messages]);

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    // Add empty AI message to stream into
    setMessages(prev => [...prev, { role: "ai", content: "" }]);

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });

      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // FIX 1: Added { stream: true } to prevent cutting emojis or special chars in half
        const text = decoder.decode(value, { stream: true });
        
        // Split by standard newline
        const lines = text.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.response) {
              setMessages(prev => {
                const newMessages = [...prev];
                const lastIndex = newMessages.length - 1;
                
                // FIX 2: Create a new object to avoid React Strict Mode double-firing bug
                newMessages[lastIndex] = {
                  ...newMessages[lastIndex],
                  content: newMessages[lastIndex].content + json.response
                };
                
                return newMessages;
              });
            }
          } catch (e) {
            // Silently ignore parse errors for partial chunks
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[80vh] max-w-4xl mx-auto w-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "ai" && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
            )}
            
            <div className={`max-w-[80%] rounded-2xl p-4 ${
              msg.role === "user" 
                ? "bg-zinc-100 dark:bg-zinc-800 rounded-tr-sm" 
                : "bg-transparent prose dark:prose-invert whitespace-pre-wrap"
            }`}>
              {msg.content}
              {loading && msg.role === "ai" && !msg.content && (
                 <Loader2 className="w-5 h-5 animate-spin text-zinc-400 mt-1" />
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white dark:bg-black border-t dark:border-zinc-800">
        <form onSubmit={sendMessage} className="relative max-w-3xl mx-auto">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a question about the document..."
            className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full pl-6 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700 transition"
          />
          <button 
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}