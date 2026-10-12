import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import type { CommerceD1, D1Statement } from "../config";

export function sqliteFixture() {
  const native = new DatabaseSync(":memory:");
  native.exec("PRAGMA foreign_keys=ON");
  for (const name of ["0001_commerce.sql", "0002_buyer_records.sql"]) {
    native.exec(readFileSync(new URL("../../../../../commerce/migrations/" + name, import.meta.url), "utf8"));
  }
  class Statement implements D1Statement {
    values: unknown[] = [];
    constructor(readonly sql: string) {}
    bind(...values: unknown[]) { this.values = values; return this; }
    async first<T>() { return (native.prepare(this.sql).get(...this.values as never[]) ?? null) as T | null; }
    async run() {
      const r = native.prepare(this.sql).run(...this.values as never[]);
      return { success: true, meta: { changes: Number(r.changes) } };
    }
  }
  const db: CommerceD1 = {
    prepare: sql => new Statement(sql),
    async batch(statements) {
      native.exec("BEGIN");
      try {
        const results = [];
        for (const s of statements) results.push(await s.run());
        native.exec("COMMIT");
        return results;
      } catch (e) { native.exec("ROLLBACK"); throw e; }
    },
  };
  return { native, db };
}
