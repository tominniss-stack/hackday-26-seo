import { NextRequest, NextResponse } from 'next/server';
import { fetchSERankingMetrics } from '@/lib/se-ranking-api';

/**
 * Test the SE Ranking connection using the CREDENTIALS PROVIDED IN THE REQUEST
 * BODY (the live form input), so an analyst can validate before saving.
 *
 * Body: { apiKey?, endpointUrl?, projectId?, domain? }
 * Returns: { ok: true, metrics } on success, or { ok: false, error } on failure.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const apiKey: string | undefined = body.apiKey?.trim() || undefined;
    const endpointUrl: string | undefined = body.endpointUrl?.trim() || undefined;
    const projectId: string | undefined = body.projectId?.trim() || undefined;
    const domain: string = (body.domain?.trim() as string) || '';

    // Need at least a way to build a request: a custom endpoint or a project ID.
    if (!endpointUrl && !projectId) {
      return NextResponse.json(
        { ok: false, error: 'Provide a Custom Endpoint URL or a Project ID to test.' },
        { status: 400 }
      );
    }

    // Need a key (request value preferred; otherwise the server env fallback).
    if (!apiKey && !process.env.SERANKING_API_KEY) {
      return NextResponse.json(
        { ok: false, error: 'No SE Ranking API key provided or configured on the server.' },
        { status: 400 }
      );
    }

    const metrics = await fetchSERankingMetrics(domain, apiKey, endpointUrl, projectId);

    if (!metrics) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'SE Ranking returned no data. Check the API key, endpoint URL / project ID, and that the domain is registered (see server logs for the exact HTTP status).',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, metrics });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
