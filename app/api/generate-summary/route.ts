import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // Parse request body
    const { report_id, section = 'executive' } = await request.json();

    if (!report_id) {
      return NextResponse.json(
        { error: 'report_id is required' },
        { status: 400 }
      );
    }

    const validSections = ['executive', 'technical', 'traffic'];
    if (!validSections.includes(section)) {
      return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
    }

    // Fetch the report with related data
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select(`
        *,
        client:clients(*),
        metrics:metrics_snapshots(*),
        narrative:narratives(*)
      `)
      .eq('id', report_id)
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Tier 1: Global Settings
    const { data: settingsData } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'global_system_prompt')
      .single();
    const globalSystemPrompt = settingsData?.value || 'You are an expert B2B SEO analyst.';

    // Tier 3: Historical Context
    // Query the database for the previous report for this specific client
    const { data: previousReports } = await supabase
      .from('reports')
      .select('*, narrative:narratives(*)')
      .eq('client_id', report.client_id)
      .lt('reporting_month', report.reporting_month)
      .order('reporting_month', { ascending: false })
      .limit(1);

    const previousReport = previousReports?.[0];
    const previousNarrative = previousReport?.narrative?.find((n: { section: string }) => n.section === section)?.final_text || 'No previous data.';

    // Extract data
    const companyName = report.client?.company_name || 'the client';
    const customPrompt = report.client?.custom_ai_prompt || 'No specific background provided.';
    const reportContext = report.report_context_prompt || 'No specific context for this month.';
    const metrics = report.metrics?.[0]?.data_json || {};

    // Directory Patterns
    const directoryPatterns = (metrics as any).directory_patterns || {};

    // Section-specific prompt configuration
    const sectionPrompts: Record<string, { focus: string; dataKeys: string[] }> = {
      executive: {
        focus: 'Write a 3-sentence high-level executive summary covering overall performance, key wins, and the primary recommendation.',
        dataKeys: ['total_urls', 'non_indexable', 'ga4_sessions', 'ga4_active_users'],
      },
      technical: {
        focus: 'Write 2-3 sentences analysing the technical crawl health: indexability ratio, error counts, and redirect chains. Focus on what was found and what action is recommended.',
        dataKeys: ['total_urls', 'non_indexable', 'client_errors_4xx', 'server_errors_5xx', 'redirects_3xx', 'missing_h1'],
      },
      traffic: {
        focus: 'Write 2-3 sentences analysing organic traffic performance: total sessions, top-performing channels, and key GSC query insights.',
        dataKeys: ['ga4_sessions', 'ga4_active_users', 'ga4_channels', 'gsc_top_queries'],
      },
    };

    const sectionConfig = sectionPrompts[section];
    const relevantMetrics: Record<string, unknown> = {};
    for (const key of sectionConfig.dataKeys) {
      if (metrics[key] !== undefined) relevantMetrics[key] = metrics[key];
    }

    // Combine Prompts
    const systemPrompt = globalSystemPrompt;

    const userPrompt = `Client Background: ${customPrompt}

This Month's Context: ${reportContext}

Previous Report Findings: ${previousNarrative}

Relevant Data:
${JSON.stringify(relevantMetrics, null, 2)}

Directory Patterns (Top Affected Areas):
${JSON.stringify(directoryPatterns, null, 2)}

Task: Review our previous findings and recommendations. Based on these past statements, analyze the current data changes to explicitly state what has successfully recovered, what stagnated, or what declined. ${sectionConfig.focus}`;

    // Call Anthropic API
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Extract the generated text
    const generatedText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    if (!generatedText) {
      return NextResponse.json(
        { error: 'Failed to generate text from Claude' },
        { status: 500 }
      );
    }

    // Find the narrative row for this section
    const narrativeRow = report.narrative?.find((n: { section: string }) => n.section === section);

    if (narrativeRow) {
      const { error: updateError } = await (supabase as any)
        .from('narratives')
        .update({ final_text: generatedText })
        .eq('id', narrativeRow.id);

      if (updateError) {
        console.error('Error updating narrative:', updateError);
        return NextResponse.json({ error: 'Failed to save generated text' }, { status: 500 });
      }
    } else {
      // Insert a new narrative row for this section
      const { error: insertError } = await (supabase as any)
        .from('narratives')
        .insert({ report_id: report_id, section, final_text: generatedText });

      if (insertError) {
        console.error('Error inserting narrative:', insertError);
        return NextResponse.json({ error: 'Failed to save generated text' }, { status: 500 });
      }
    }

    // Return the generated text
    return NextResponse.json({
      success: true,
      text: generatedText,
    });

  } catch (error: any) {
    console.error('Error in generate-summary API:', error);
    
    // Handle specific Anthropic API errors
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Invalid Anthropic API key' },
        { status: 401 }
      );
    }
    
    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
