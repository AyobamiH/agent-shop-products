import { absoluteUrl } from "@/lib/site";

export const EXPLICIT_CRAWLER_ALLOWLIST = [
  "OAI-SearchBot",
  "GPTBot",
  "Claude-SearchBot",
  "Claude-User",
  "ClaudeBot",
  "PerplexityBot",
  "Perplexity-User",
  "Googlebot",
  "Google-Extended",
  "bingbot",
  "Applebot",
  "Applebot-Extended",
] as const;

export function buildRobotsTxt(): string {
  const rules = EXPLICIT_CRAWLER_ALLOWLIST.flatMap((agent) => [
    `User-agent: ${agent}`,
    "Allow: /",
    "",
  ]);

  return [
    ...rules,
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
    "",
  ].join("\n");
}
