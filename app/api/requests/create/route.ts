import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const PRIORITY_MAP: Record<string, string> = {
  Low: 'Low',
  Medium: 'Medium',
  High: 'High',
  Urgent: 'Highest',
};

export async function POST(request: NextRequest) {
  try {
    const { client_id, title, description, priority = 'Medium' } = await request.json();

    if (!client_id || !title || !description) {
      return NextResponse.json({ error: 'client_id, title, and description are required' }, { status: 400 });
    }

    // Fetch client Jira credentials from DB
    const { data: client, error: clientError } = await (supabase as any)
      .from('clients')
      .select('jira_api_key, jira_email, jira_project_key')
      .eq('id', client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const jiraBaseUrl = process.env.JIRA_BASE_URL;
    const { jira_api_key, jira_email, jira_project_key } = client;

    // Graceful fallback if Jira not configured
    if (!jiraBaseUrl || !jira_api_key || !jira_email || !jira_project_key) {
      return NextResponse.json({
        success: true,
        method: 'local',
        message: 'Request logged locally. Jira integration not configured for this client.',
      });
    }

    // Create Jira issue via REST API
    const jiraPriority = PRIORITY_MAP[priority] ?? 'Medium';
    const auth = Buffer.from(`${jira_email}:${jira_api_key}`).toString('base64');

    const jiraRes = await fetch(`${jiraBaseUrl}/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          project: { key: jira_project_key },
          summary: title,
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: description }],
              },
            ],
          },
          issuetype: { name: 'Task' },
          priority: { name: jiraPriority },
        },
      }),
    });

    if (!jiraRes.ok) {
      const errBody = await jiraRes.text();
      console.error('Jira API error:', errBody);
      // Graceful fallback — don't crash the client portal
      return NextResponse.json({
        success: true,
        method: 'local',
        message: 'Request logged. Jira API returned an error — your account manager will be in touch.',
      });
    }

    const jiraData = await jiraRes.json();

    return NextResponse.json({
      success: true,
      method: 'jira',
      issue_key: jiraData.key,
      issue_url: `${jiraBaseUrl}/browse/${jiraData.key}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Jira create route error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
