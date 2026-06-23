interface SERankingMetrics {
  domain_trust: number;
  total_backlinks: number;
  referring_domains: number;
  /** 'api' = real data from SE Ranking; 'mock' = graceful fallback sample data. */
  source: 'api' | 'mock';
}

export async function fetchSERankingMetrics(
  domain: string,
  apiKey?: string
): Promise<SERankingMetrics | null> {
  const key = apiKey || process.env.SERANKING_API_KEY;

  if (!key) {
    console.warn('[SE Ranking] API key not configured — skipping fetch.');
    return null;
  }

  const endpoint = `https://api4.seranking.com/sites/${encodeURIComponent(domain)}/backlinks/summary`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Token ${key}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      // Capture the raw body so we can surface the exact API error downstream.
      const responseText = await response.text().catch(() => '<unable to read response body>');
      console.error(
        `[SE Ranking] HTTP ${response.status} ${response.statusText} for domain "${domain}".`,
        `\n  Endpoint: ${endpoint}`,
        `\n  Response body: ${responseText}`
      );
      throw new Error(`SE Ranking API error: HTTP ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      domain_trust: data.domain_trust ?? 0,
      total_backlinks: data.total_backlinks ?? 0,
      referring_domains: data.referring_domains ?? 0,
      source: 'api',
    };
  } catch (error) {
    // Expose the silent failure: log the precise error type/message + context.
    const message = error instanceof Error ? error.message : String(error);
    const name = error instanceof Error ? error.name : 'UnknownError';
    console.error(
      `[SE Ranking] fetch failed for domain "${domain}".`,
      `\n  Endpoint: ${endpoint}`,
      `\n  Error name: ${name}`,
      `\n  Error message: ${message}`
    );
    if (name === 'TimeoutError' || name === 'AbortError') {
      console.error('[SE Ranking] Request timed out after 10s.');
    }

    // Graceful fallback to sample data so the wider report sync still succeeds.
    // Clearly flagged as 'mock' so the UI never presents it as real API data.
    return {
      domain_trust: 45,
      total_backlinks: 1250,
      referring_domains: 320,
      source: 'mock',
    };
  }
}
