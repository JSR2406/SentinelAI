import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { apiClient } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/copilot")({
  head: () => ({
    meta: [
      { title: "AI Copilot — SentinelAI" },
      { name: "description", content: "Ask the SentinelAI copilot about vulnerabilities and fixes." },
    ],
  }),
  component: CopilotPage,
});

type Msg = { id: number; role: "user" | "assistant"; text: string };

const initial: Msg[] = [
  { id: 1, role: "user", text: "What's the most urgent issue in payments-api?" },
  {
    id: 2,
    role: "assistant",
    text: "An AWS access key is committed at services/payments/config/aws.ts:14. It is reachable from a public branch and the matching IAM role has wildcard permissions, so it chains into full database access. Revoke the key, move it to the secret store, and scope the IAM policy to the four actions the service uses.",
  },
];

const canned = [
  "That dependency is exploitable: the vulnerable code path is called from your request handler, so an upgrade to 4.17.21 is the minimal fix.",
  "I drafted a patch that adds audience validation to the JWT verifier and fails closed on mismatch. Want me to open a pull request?",
  "Enabling RLS on `invoices` with an owner-scoped read policy removes the highest-impact database finding in this report.",
];

function CopilotPage() {
  const [messages, setMessages] = useState(initial);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  
  const [conversations, setConversations] = useState([
    { id: "1", title: "payments-api #4821", when: "Today at 10:42 AM" },
    { id: "2", title: "auth-service #110", when: "Yesterday" }
  ]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    const id = Date.now();
    setMessages((m) => [...m, { id, role: "user", text }]);
    setInput("");
    setTyping(true);
    try {
      const res = await apiClient.chatAICopilot({ scanId: "demo-scan", message: text });
      setMessages((m) => [...m, { id: id + 1, role: "assistant", text: res.explanation }]);
    } catch {
      // Fallback to canned responses when backend offline
      setMessages((m) => [
        ...m,
        { id: id + 1, role: "assistant", text: canned[m.length % canned.length] ?? canned[0]! },
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="glass hidden rounded-2xl p-4 lg:block">
        <p className="px-2 text-xs uppercase tracking-wide text-muted-foreground">Conversations</p>
        <div className="mt-3 grid gap-1">
          {conversations.map((c, i) => (
            <button
              key={c.id}
              className={`truncate rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                i === 0 ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60"
              }`}
            >
              {c.title}
              <span className="block text-[11px] text-muted-foreground">{c.when}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="glass flex h-[calc(100vh-11rem)] flex-col rounded-2xl">
        <header className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand">
            <Sparkles className="h-4 w-4 text-accent-foreground" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">SentinelAI Copilot</p>
            <p className="truncate text-xs text-muted-foreground">Context: payments-api scan #4821</p>
          </div>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%] ${
                  m.role === "user"
                    ? "bg-gradient-brand text-accent-foreground"
                    : "border border-border bg-secondary/50 text-foreground"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="flex gap-1 rounded-2xl border border-border bg-secondary/50 px-4 py-3">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                    style={{ animationDelay: `${i * 120}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={send} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 border-t border-border p-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a finding, CVE, or fix…"
            className="min-w-0 rounded-xl border border-input bg-secondary/40 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-brand-blue/60"
          />
          <button
            type="submit"
            aria-label="Send message"
            className="grid shrink-0 place-items-center rounded-xl bg-gradient-brand px-4 text-accent-foreground transition-opacity hover:opacity-90"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}