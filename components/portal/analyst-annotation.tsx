'use client';

import { MessageSquareText } from 'lucide-react';

interface AnalystAnnotationProps {
  text: string;
  clientColor?: string;
}

export function AnalystAnnotation({ text, clientColor = '#3b82f6' }: AnalystAnnotationProps) {
  return (
    <div
      className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 mt-3"
      style={{ borderLeftWidth: '3px', borderLeftColor: clientColor }}
    >
      <div className="flex items-start gap-2.5">
        <MessageSquareText className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Analyst Context
          </p>
          <p className="text-sm text-slate-600 leading-relaxed italic">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}
