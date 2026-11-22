// Fixed, owned referral domains only. Nothing from a referring URL is transmitted.
export const ASSISTANT_REFERRERS = [
  ["chatgpt.com", "chatgpt.com"],
  ["chat.openai.com", "chat.openai.com"],
  ["claude.ai", "claude.ai"],
  ["perplexity.ai", "perplexity.ai"],
  ["copilot.microsoft.com", "copilot.microsoft.com"],
  ["gemini.google.com", "gemini.google.com"],
  ["deepseek.com", "deepseek.com"],
] as const;

export type AssistantSource = (typeof ASSISTANT_REFERRERS)[number][1];

// Align labels with Search Console Operator's existing GA4 assistant-domain selector.
// A bare string or a lookalike hostname cannot become an attribution source.
export function classifyAssistantReferrer(raw: string): AssistantSource | null {
  if (!raw || raw.length > 4096) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
  const hostname = url.hostname.toLowerCase();
  for (const [domain, source] of ASSISTANT_REFERRERS) {
    if (hostname === domain || hostname.endsWith("." + domain)) return source;
  }
  return null;
}
