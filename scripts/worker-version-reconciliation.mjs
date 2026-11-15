/**
 * Read-only, exact-source recovery after an uncertain Worker Version upload.
 * Cloudflare's version listing, not Wrangler's human-readable stdout, is the
 * authority. An alias must identify the same source SHA, never just a prefix.
 */
const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const SHA = /^[0-9a-f]{40}$/;
const MAX_PAGES = 20;
const PAGE_SIZE = 100;

export function candidateFromRows(rows, sha) {
  if (!SHA.test(sha) || !Array.isArray(rows)) throw Error("CANDIDATE_QUERY_INVALID");
  const found = rows.filter((v) => v?.annotations?.["workers/tag"] === sha);
  if (found.length > 1) throw Error("CANDIDATE_DUPLICATE_EXACT_SHA");
  if (!found.length) return null;
  const candidate = found[0];
  if (!UUID.test(candidate.id || "") ||
      candidate.annotations["workers/alias"] !== "release-" + sha.slice(0, 8)) {
    throw Error("CANDIDATE_ALIAS_OR_VERSION_MISMATCH");
  }
  return {
    versionId: candidate.id.toLowerCase(),
    previewURL: "https://release-" + sha.slice(0, 8) + "-agent-shop.woeinvests.workers.dev",
  };
}

export function normaliseCloudflareVersionPage(envelope) {
  if (envelope?.success !== true || !Array.isArray(envelope?.result?.items) ||
      !envelope?.result_info) throw Error("CLOUDFLARE_VERSION_RESPONSE_INVALID");
  return { items: envelope.result.items, result_info: envelope.result_info };
}

export async function listExactCandidate({ sha, readPage }) {
  if (!SHA.test(sha) || typeof readPage !== "function") throw Error("CANDIDATE_QUERY_INVALID");
  const rows = [];
  let total = null;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const result = await readPage(page, PAGE_SIZE);
    const items = result?.items;
    const info = result?.result_info;
    if (!Array.isArray(items) || !info || info.page !== page ||
        info.per_page !== PAGE_SIZE || !Number.isInteger(info.total_count) ||
        info.total_count < 0 || info.total_count > MAX_PAGES * PAGE_SIZE ||
        (total !== null && total !== info.total_count)) {
      throw Error("CANDIDATE_LIST_INCOMPLETE_OR_MALFORMED");
    }
    total = info.total_count;
    rows.push(...items);
    if (rows.length > total) throw Error("CANDIDATE_LIST_OVERFULL");
    if (rows.length === total) return candidateFromRows(rows, sha);
    if (items.length !== PAGE_SIZE) throw Error("CANDIDATE_LIST_INCOMPLETE_OR_MALFORMED");
  }
  throw Error("CANDIDATE_LIST_EXCEEDS_BOUNDS");
}

export async function observeExactCandidate({ sha, readPage, delay = () => Promise.resolve(), attempts = 4 }) {
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 6) {
    throw Error("CANDIDATE_RECONCILIATION_BOUNDS_INVALID");
  }
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const found = await listExactCandidate({ sha, readPage });
    if (found) return found;
    if (attempt !== attempts) await delay(2000);
  }
  return null;
}

export function makeVersionPageReader({ baseUrl, token, fetchImpl = fetch }) {
  if (typeof baseUrl !== "string" ||
      !/^https:\/\/api\.cloudflare\.com\/client\/v4\/accounts\/[0-9a-f]{32}\/workers\/scripts\/agent-shop$/.test(baseUrl) ||
      !token || typeof fetchImpl !== "function") {
    throw Error("VERSION_PAGE_READER_CONFIGURATION_INVALID");
  }
  return async (page, perPage) => {
    const response = await fetchImpl(baseUrl + "/versions?page=" + page + "&per_page=" + perPage, {
      headers: { Authorization: "Bearer " + token },
      signal: AbortSignal.timeout(20000),
    });
    const payload = await response.json();
    if (!response.ok || payload?.success !== true) {
      throw Error("CLOUDFLARE_VERSIONS_HTTP_" + response.status);
    }
    return normaliseCloudflareVersionPage(payload);
  };
}
