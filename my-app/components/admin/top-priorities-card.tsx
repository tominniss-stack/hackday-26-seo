'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { PriorityIssue } from '@/lib/priority-calculator';

interface TopPrioritiesCardProps {
  priorities: PriorityIssue[];
  clientColor?: string;
}

export function TopPrioritiesCard({ priorities, clientColor = '#3b82f6' }: TopPrioritiesCardProps) {
  if (priorities.length === 0) {
    return (
      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="h-4 w-4 text-emerald-600" />
            Top Actionable Priorities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            ✅ No critical issues detected. All technical health metrics are within acceptable ranges.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-l-red-500';
      case 'high':
        return 'border-l-orange-500';
      default:
        return 'border-l-blue-500';
    }
  };

  const getBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <Card className={`border-l-4 ${getSeverityColor(priorities[0].severity)}`}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          {getSeverityIcon(priorities[0].severity)}
          Top Actionable Priorities
        </CardTitle>
        <p className="text-xs text-slate-500 mt-1">
          Automatically ranked by impact and urgency
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {priorities.map((issue, index) => (
            <div
              key={issue.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100"
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-slate-900">{issue.title}</h4>
                  <Badge className={`text-[10px] font-medium uppercase tracking-wider ${getBadgeVariant(issue.severity)}`}>
                    {issue.severity}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {issue.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
