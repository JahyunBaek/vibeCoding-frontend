import { apiRequest } from "@/lib/client";

export const agentApi = {
  agentProviders: () => apiRequest<any[]>("GET", "/api/agent/providers"),
  agentDatasets: () => apiRequest<any[]>("GET", "/api/agent/datasets"),
  agentChat: (provider: string, dataset: string, message: string) =>
    apiRequest<any>("POST", "/api/agent/chat", { provider, dataset, message }),
};
