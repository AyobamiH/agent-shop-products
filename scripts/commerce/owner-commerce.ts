import { closeSync, fsyncSync, openSync, writeFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { recoverOrderAccess } from "../../frontend/src/server/commerce/recovery";
import type { RecoveryEvidence } from "../../frontend/src/server/commerce/recovery";
import { runRetention } from "../../frontend/src/server/commerce/retention";
import { operatorEnvironment, readPrivateJson } from "./operator-config";

async function main() {
  const [action, configFile, inputFile, outputFile] = process.argv.slice(2);
  if (!configFile || !["status", "retention", "recover"].includes(action || "")) {
    throw Error("USAGE: bun scripts/commerce/owner-commerce.ts status|retention|recover PRIVATE_CONFIG [PRIVATE_INPUT PRIVATE_OUTPUT]");
  }
  const env = operatorEnvironment(configFile), db = env.COMMERCE_DB!;
  if (action === "status") {
    const rows = await db.prepare("SELECT COUNT(*) AS orders, SUM(CASE WHEN state='paid' THEN 1 ELSE 0 END) AS paid FROM commerce_orders").first();
    const review = await db.prepare("SELECT COUNT(*) AS financialReviewsDue FROM commerce_contracts WHERE financial_retain_until<? AND legal_hold=0")
      .bind(new Date().toISOString()).first();
    console.log(JSON.stringify({ status: "PASS", mode: env.COMMERCE_MODE, ...rows, ...review })); return;
  }
  if (action === "retention") {
    console.log(JSON.stringify({ status: "PASS", mode: env.COMMERCE_MODE, operations: await runRetention(db) })); return;
  }
  if (!inputFile || !outputFile || !env.STRIPE_SECRET_KEY) throw Error("RECOVERY_INPUT_OUTPUT_AND_RESTRICTED_KEY_REQUIRED");
  const evidence = readPrivateJson(inputFile) as unknown as RecoveryEvidence;
  // Reserve the output before rotating anything: never overwrite a prior secret.
  const target = resolve(outputFile), fd = openSync(target, "wx", 0o600);
  try {
    const result = await recoverOrderAccess(env, evidence);
    writeFileSync(fd, JSON.stringify(result) + "\n");
    fsyncSync(fd);
    console.log(JSON.stringify({ status: "PASS", mode: env.COMMERCE_MODE, recoveryApplied: true }));
  } catch (error) { unlinkSync(target); throw error; }
  finally { closeSync(fd); }
}
main().catch(error => {
  const message = error instanceof Error ? error.message : "OPERATION_FAILED";
  console.error(/^[A-Z0-9_:| \[\]-]+$/.test(message) ? message : "OPERATION_FAILED");
  process.exitCode = 1;
});
