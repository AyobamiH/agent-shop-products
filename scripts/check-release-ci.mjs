import { pathToFileURL } from "node:url";

const SHA = /^[a-f0-9]{40}$/;
export function requireExactMainCI(sha, ref, main, workflowRuns) {
  if (!SHA.test(sha) || ref !== "refs/heads/main" || main !== sha) {
    throw Error("NOT_EXACT_CURRENT_MAIN");
  }
  if (!Array.isArray(workflowRuns) || !workflowRuns.some((run) =>
    run.head_sha === sha && run.head_branch === "main" &&
    run.event === "push" && run.status === "completed" &&
    run.conclusion === "success"
  )) throw Error("EXACT_MAIN_CI_NOT_SUCCESSFUL");
  return { sha, ciVerdict: "PASS" };
}

async function getGitHub(path, token) {
  let response;
  try {
    response = await fetch("https://api.github.com" + path, {
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2026-03-10",
      },
      signal: AbortSignal.timeout(15000),
    });
  } catch { throw Error("GITHUB_ADMISSION_TRANSPORT_UNAVAILABLE"); }
  if (!response.ok) throw Error("GITHUB_ADMISSION_HTTP_" + response.status);
  try { return await response.json(); }
  catch { throw Error("GITHUB_ADMISSION_MALFORMED"); }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  (async () => {
    const { GITHUB_TOKEN, GITHUB_SHA, GITHUB_REF, GITHUB_REPOSITORY } = process.env;
    if (!GITHUB_TOKEN || GITHUB_REPOSITORY !== "AyobamiH/agent-shop-products") {
      throw Error("GITHUB_ADMISSION_AUTH_UNAVAILABLE");
    }
    const ref = await getGitHub("/repos/" + GITHUB_REPOSITORY + "/git/ref/heads/main", GITHUB_TOKEN);
    const result = await getGitHub(
      "/repos/" + GITHUB_REPOSITORY + "/actions/workflows/frontend-ci.yml/runs" +
      "?head_sha=" + encodeURIComponent(GITHUB_SHA) + "&event=push&per_page=30", GITHUB_TOKEN,
    );
    const verdict = requireExactMainCI(GITHUB_SHA, GITHUB_REF, ref?.object?.sha, result?.workflow_runs);
    console.log(JSON.stringify(verdict));
  })().catch((err) => {
    console.error("GUARDED_RELEASE_ADMISSION_FAILED " + (err instanceof Error ? err.message : "UNKNOWN"));
    process.exitCode = 1;
  });
}
