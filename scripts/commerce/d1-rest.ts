import type { CommerceD1, D1Result, D1Statement } from "../../frontend/src/server/commerce/config";
type Query = { sql: string; params: unknown[] };
type Result = D1Result & { results?: unknown[] };
export function d1Rest(account: string, database: string, token: string, fetcher: typeof fetch = fetch): CommerceD1 {
  if (!/^[a-f0-9]{32}$/.test(account) || !/^[a-f0-9-]{36}$/.test(database) || !token) throw Error("INVALID_DATABASE_CONFIG");
  const url = "https://api.cloudflare.com/client/v4/accounts/" + account + "/d1/database/" + database + "/query";
  async function query(batch: Query[]): Promise<Result[]> {
    let response;
    try {
      response = await fetcher(url, { method: "POST", signal: AbortSignal.timeout(30000),
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ batch }) });
    } catch { throw Error("D1_TRANSPORT_FAILURE"); }
    const result = await response.json() as { success?: boolean; result?: Result[] };
    if (!response.ok || result.success !== true || result.result?.length !== batch.length ||
        result.result.some(r => r.success === false)) throw Error("D1_QUERY_FAILURE");
    return result.result;
  }
  class Statement implements D1Statement {
    values: unknown[] = [];
    constructor(readonly sql: string) {}
    bind(...values: unknown[]) { this.values = values; return this; }
    async first<T>() { return (await query([{ sql: this.sql, params: this.values }]))[0]!.results?.[0] as T ?? null; }
    async run() { return (await query([{ sql: this.sql, params: this.values }]))[0]!; }
  }
  return { prepare: sql => new Statement(sql), batch: statements => query(statements.map(s => {
    if (!(s instanceof Statement)) throw Error("FOREIGN_DATABASE_STATEMENT");
    return { sql: s.sql, params: s.values };
  })) };
}
