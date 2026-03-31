import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Send, Bot, User, Info, Loader2, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  provider?: string;
};

const PROVIDER_ICONS: Record<string, string> = {
  openai: "🤖",
  google: "💎",
  anthropic: "🧠",
};

export default function AgentChatPage() {
  const { t } = useTranslation();
  const [provider, setProvider] = useState("");
  const [dataset, setDataset] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: providers = [] } = useQuery<any[]>({
    queryKey: ["agent", "providers"],
    queryFn: () => api.agentProviders(),
  });

  const { data: datasets = [] } = useQuery<any[]>({
    queryKey: ["agent", "datasets"],
    queryFn: () => api.agentDatasets(),
  });

  const chatMut = useMutation({
    mutationFn: (message: string) => api.agentChat(provider, dataset, message),
    onSuccess: (data: any) => {
      setMessages((prev) => [
        ...prev,
        {
          id: data.id,
          role: "assistant",
          content: data.message,
          timestamp: data.timestamp,
          provider: data.provider,
        },
      ]);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatMut.isPending]);

  // Auto-select first provider and dataset
  useEffect(() => {
    if (providers.length > 0 && !provider) setProvider(providers[0].id);
  }, [providers, provider]);
  useEffect(() => {
    if (datasets.length > 0 && !dataset) setDataset(datasets[0].id);
  }, [datasets, dataset]);

  const selectedProvider = providers.find((p: any) => p.id === provider);
  const selectedDataset = datasets.find((d: any) => d.id === dataset);

  const handleSend = () => {
    const msg = input.trim();
    if (!msg || !provider || !dataset) return;

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: msg,
        timestamp: new Date().toISOString(),
      },
    ]);
    setInput("");
    chatMut.mutate(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  const canSend = provider && dataset && input.trim() && !chatMut.isPending;

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">{t("agent.pageTitle")}</div>

      {/* Mock notice */}
      <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-600">
        <Info className="h-4 w-4 shrink-0" />
        {t("agent.mockNotice")}
      </div>

      {/* Config bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">{t("agent.dataset")}:</label>
          <select
            className="h-9 rounded-md border bg-surface px-3 text-sm"
            value={dataset}
            onChange={(e) => {
              setDataset(e.target.value);
              setMessages([]);
            }}
          >
            {datasets.map((d: any) => (
              <option key={d.id} value={d.id}>{d.name} ({d.recordCount}{t("common.cases")})</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">{t("agent.provider")}:</label>
          <div className="flex gap-1.5">
            {providers.map((p: any) => (
              <button
                key={p.id}
                onClick={() => {
                  setProvider(p.id);
                  setMessages([]);
                }}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-all ${
                  provider === p.id
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                <span>{PROVIDER_ICONS[p.icon] ?? "🤖"}</span>
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {selectedProvider && (
          <Badge variant="outline" className="text-xs">
            {selectedProvider.model}
          </Badge>
        )}

        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClear} className="ml-auto text-muted-foreground">
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            {t("agent.clearChat")}
          </Button>
        )}
      </div>

      {/* Chat area */}
      <Card className="flex flex-col" style={{ height: "calc(100vh - 320px)", minHeight: 400 }}>
        <CardHeader className="border-b py-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bot className="h-4 w-4" />
            {selectedProvider?.name ?? "Agent"} — {selectedDataset?.name ?? t("agent.dataset")}
            {selectedDataset && (
              <span className="text-xs text-muted-foreground font-normal">
                ({selectedDataset.description})
              </span>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm space-y-3">
              <Bot className="h-12 w-12 opacity-20" />
              <p>{t("agent.emptyChat")}</p>
              <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                {(dataset === "patients"
                  ? ["환자 데이터 통계를 알려주세요", "혈액형 분포를 분석해주세요", "진료과별 환자 현황"]
                  : ["임상시험 요약 통계", "등록 현황 분석해주세요", "단계별 시험 현황"]
                ).map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                    className="rounded-full border border-dashed px-3 py-1 text-xs hover:bg-muted transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {chatMut.isPending && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("agent.thinking")}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input area */}
        <div className="border-t p-3">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              className="flex-1 resize-none rounded-lg border bg-surface px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              rows={2}
              placeholder={t("agent.inputPlaceholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={chatMut.isPending}
            />
            <Button
              onClick={handleSend}
              disabled={!canSend}
              className="self-end"
              size="sm"
            >
              <Send className="mr-1 h-4 w-4" />
              {t("agent.send")}
            </Button>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t("agent.inputHint")}
          </p>
        </div>
      </Card>
    </div>
  );
}
