'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { MonthYearSelector } from './month-year-selector';
import { MoMBadge } from './mom-badge';
import { generateMoMChange, MOCK_PPC_CAMPAIGNS } from '@/lib/mock-data';

interface PPCViewProps {
  clientColor: string;
  reportingMonth: string;
}

export function PPCView({ clientColor, reportingMonth }: PPCViewProps) {
  const [openCampaigns, setOpenCampaigns] = useState<Record<number, boolean>>({});

  const toggleCampaign = (index: number) => {
    setOpenCampaigns((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const formatCurrency = (value: number) =>
    `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-8">
      {/* Header with month selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Paid Media (PPC)</h1>
          <p className="text-sm text-slate-500 mt-0.5">Campaign performance and ad creative analysis</p>
        </div>
        <MonthYearSelector reportingMonth={reportingMonth} />
      </div>

      {/* PPC Executive Summary */}
      <Card className="border-l-4" style={{ borderLeftColor: clientColor }}>
        <CardHeader>
          <CardTitle className="text-base">Paid Media Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-slate prose-sm max-w-none prose-p:text-slate-600 prose-p:leading-relaxed">
            <ReactMarkdown>
              {`Paid Media performance remains highly efficient this month. The LinkedIn B2B campaign drove a **15% decrease in Cost Per Acquisition**, while Google Search captured high-intent generic terms. **Recommendation:** Reallocate 20% of the Meta retargeting budget to scale the winning LinkedIn creatives.`}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Accordion List */}
      <div>
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
          Campaign Performance
        </h2>
        <div className="space-y-3">
          {MOCK_PPC_CAMPAIGNS.map((campaign, index) => {
            const spendMoM = generateMoMChange(campaign.spend, `ppc-spend-${campaign.name}`);
            const convMoM = generateMoMChange(campaign.conversions, `ppc-conv-${campaign.name}`, { biasUp: true });
            const cpaMoM = generateMoMChange(Math.round(campaign.cpa), `ppc-cpa-${campaign.name}`);
            const roasMoM = generateMoMChange(Math.round(campaign.roas * 10), `ppc-roas-${campaign.name}`, { biasUp: true });

            return (
              <Collapsible
                key={index}
                open={openCampaigns[index] || false}
                onOpenChange={() => toggleCampaign(index)}
              >
                <Card className="overflow-hidden">
                  <CollapsibleTrigger className="w-full text-left">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <ChevronDown
                            className={`h-4 w-4 text-slate-400 transition-transform shrink-0 ${
                              openCampaigns[index] ? 'rotate-180' : ''
                            }`}
                          />
                          <span className="font-medium text-slate-900 truncate">
                            {campaign.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 md:gap-6 text-sm shrink-0">
                          <div className="text-center hidden sm:block">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Spend</p>
                            <p className="font-semibold text-slate-900 tabular-nums">
                              {formatCurrency(campaign.spend)}
                            </p>
                            <MoMBadge {...spendMoM} invertColors />
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Conv.</p>
                            <p className="font-semibold text-slate-900 tabular-nums">
                              {campaign.conversions}
                            </p>
                            <MoMBadge {...convMoM} />
                          </div>
                          <div className="text-center hidden md:block">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">CPA</p>
                            <p className="font-semibold text-slate-900 tabular-nums">
                              {formatCurrency(campaign.cpa)}
                            </p>
                            <MoMBadge {...cpaMoM} invertColors />
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">ROAS</p>
                            <p className="font-semibold tabular-nums" style={{ color: clientColor }}>
                              {campaign.roas}x
                            </p>
                            <MoMBadge {...roasMoM} />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t border-slate-100">
                      {/* Target Keywords Performance */}
                      <div className="px-6 py-5">
                        <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
                          Target Keywords Performance
                        </h4>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Keyword / Audience</TableHead>
                                <TableHead className="text-center">Match Type</TableHead>
                                <TableHead className="text-center">Clicks</TableHead>
                                <TableHead className="text-center hidden sm:table-cell">Impressions</TableHead>
                                <TableHead className="text-center hidden sm:table-cell">CTR</TableHead>
                                <TableHead className="text-center hidden md:table-cell">Avg. CPC</TableHead>
                                <TableHead className="text-center">Conv.</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {campaign.keywords.map((kw, ki) => (
                                <TableRow key={ki}>
                                  <TableCell className="font-medium text-slate-900 text-xs">
                                    {kw.keyword}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                      {kw.matchType}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center tabular-nums text-xs">{kw.clicks.toLocaleString()}</TableCell>
                                  <TableCell className="text-center tabular-nums text-xs hidden sm:table-cell">{kw.impressions.toLocaleString()}</TableCell>
                                  <TableCell className="text-center tabular-nums text-xs hidden sm:table-cell">{kw.ctr}</TableCell>
                                  <TableCell className="text-center tabular-nums text-xs hidden md:table-cell">{kw.avgCpc}</TableCell>
                                  <TableCell className="text-center tabular-nums text-xs font-medium">{kw.conversions}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      {/* Top Performing Ad Creatives */}
                      <div className="px-6 py-5 border-t border-slate-50 bg-slate-50/30">
                        <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
                          Top Performing Ad Creatives
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {campaign.creatives.map((creative, ci) => (
                            <div
                              key={ci}
                              className="rounded-lg border border-slate-200 bg-white p-4 space-y-2"
                            >
                              <p className="text-sm font-semibold text-blue-700 leading-snug">
                                {creative.headline}
                              </p>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {creative.description}
                              </p>
                              <p className="text-[10px] text-emerald-700 font-medium">
                                {creative.displayUrl}
                              </p>
                              <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
                                <div className="text-center">
                                  <p className="text-[10px] text-slate-400">CTR</p>
                                  <p className="text-xs font-semibold text-slate-700">{creative.ctr}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-[10px] text-slate-400">Conversions</p>
                                  <p className="text-xs font-semibold text-slate-700">{creative.conversions}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      </div>
    </div>
  );
}
