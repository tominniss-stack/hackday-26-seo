interface SERankingMetrics {
  domain_trust: number;
  total_backlinks: number;
  referring_domains: number;
  /** Always 'api' — real data from SE Ranking. There is no mock fallback. */
  source: 'api';
}

/**
 * Sanitise a raw domain string:
 *  - strips protocol (https://, http://)
 *  - strips trailing slashes and paths
 *  - lowercases
 * Returns the bare hostname, e.g. "brewdigital.com"
 */
function sanitiseDomain(raw: string): string {
  let d = raw.trim().toLowerCase();
  // Remove protocol
  d = d.replace(/^https?:\/\//i, '');
  // Remove path, query, fragment — keep only host
  d = d.split('/')[0].split('?')[0].split('#')[0];
  return d;
}

/**
 * Resolve the SE Ranking endpoint URL using the configured precedence:
 *  1. If a custom `endpointUrl` is provided, use it EXACTLY as-is. The admin is
 *     expected to supply a fully-qualified URL already containing the project ID.
 *  2. Otherwise, if a `projectId` is provided, build a sensible default base URL
 *     from it: https://api4.seranking.com/sites/{projectId}/backlinks/summary
 *  3. Otherwise, return null so the caller skips SE Ranking entirely.
 */
function resolveEndpointUrl(endpointUrl?: string, projectId?: string): string | null {
  const custom = endpointUrl?.trim();
  if (custom) {
    return custom;
  }
  const pid = projectId?.trim();
  if (pid) {
    return `https://api4.seranking.com/sites/${encodeURIComponent(pid)}/backlinks/summary`;
  }
  return null;
}

/**
 * Attempt a single SE Ranking fetch against the resolved URL.
 * No hardcoded endpoints — the URL is fully dynamic (see resolveEndpointUrl).
 */
async function attemptFetch(
  url: string,
  key: string
): Promise<{ ok: boolean; status: number; statusText: string; body: string; data?: Record<string, unknown> }> {
  const headers = {
    Authorization: `Token ${key}`,
    Accept: 'application/json',
  };

  console.log(`[SE Ranking] Fetching: ${url}`);
  let res: Response;
  try {
    res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
  } catch (fetchErr) {
    const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
    console.error(`[SE Ranking] Network error: ${msg}`);
    return { ok: false, status: 0, statusText: 'network error', body: '' };
  }

  const body = await res.text().catch(() => '<unable to read body>');
  console.log(`[SE Ranking] → HTTP ${res.status} ${res.statusText}`);
  if (body.length < 500) {
    console.log(`[SE Ranking] response body: ${body}`);
  }

  if (res.ok) {
    try {
      return { ok: true, status: res.status, statusText: res.statusText, body, data: JSON.parse(body) };
    } catch {
      console.error('[SE Ranking] returned non-JSON body.');
    }
  } else {
    console.error(
      `[SE Ranking] fetch failed: HTTP ${res.status} ${res.statusText}`,
      `\n  URL: ${url}`,
      `\n  Body: ${body}`
    );
  }

  return { ok: false, status: res.status, statusText: res.statusText, body };
}

/**
 * Fetch SE Ranking off-site authority metrics for a client.
 *
 * The endpoint is fully dynamic:
 *  - `endpointUrl` (when set) is used exactly as-is.
 *  - else a default URL is built from `projectId`.
 *  - else the fetch is skipped (returns null).
 *
 * On ANY failure the function returns null — it NEVER returns mock/fallback
 * numbers, so the UI can render a clean empty state.
 */
export async function fetchSERankingMetrics(
  rawDomain: string,
  apiKey?: string,
  endpointUrl?: string,
  projectId?: string
): Promise<SERankingMetrics | null> {
  const key = apiKey || process.env.SERANKING_API_KEY;

  if (!key) {
    console.warn('[SE Ranking] API key not configured — skipping fetch.');
    return null;
  }

  const url = resolveEndpointUrl(endpointUrl, projectId);
  if (!url) {
    console.warn(
      '[SE Ranking] Neither endpoint URL nor project ID configured — skipping fetch.'
    );
    return null;
  }

  const bare = sanitiseDomain(rawDomain);
  console.log(
    `[SE Ranking] Fetching metrics. raw="${rawDomain}" bare="${bare}" url="${url}"`
  );

  const result = await attemptFetch(url, key);
  if (result.ok && result.data) {
    const d = result.data;
    console.log(`[SE Ranking] ✓ Success for "${bare}".`);
    return {
      domain_trust: (d.domain_trust as number) ?? 0,
      total_backlinks: (d.total_backlinks as number) ?? 0,
      referring_domains: (d.referring_domains as number) ?? 0,
      source: 'api',
    };
  }

  // Fetch failed — return null. NO mock fallback. The UI renders an empty state.
  console.error(
    `[SE Ranking] Fetch failed for "${rawDomain}". Returning null (no fallback data). ` +
    `Check: (1) API key has the backlinks add-on, (2) the domain/project is registered ` +
    `in SE Ranking, (3) the configured endpoint URL is correct for your plan tier.`
  );
  return null;
}
