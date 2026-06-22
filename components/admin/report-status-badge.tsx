'use client';

import { Clock, CheckCircle, FileEdit } from 'lucide-react';

type PublishedStatus = 'draft' | 'pending_approval' | 'published';

interface ReportStatusBadgeProps {
  status: PublishedStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<PublishedStatus, { label: string; classes: string; Icon: React.ElementType }> = {
  draft: {
    label: 'Draft',
    classes: 'bg-slate-100 text-slate-600',
    Icon: FileEdit,
  },
  pending_approval: {
    label: 'Pending Approval',
    classes: 'bg-amber-50 text-amber-700',
    Icon: Clock,
  },
  published: {
    label: 'Published',
    classes: 'bg-emerald-50 text-emerald-700',
    Icon: CheckCircle,
  },
};

export function ReportStatusBadge({ status, size = 'sm' }: ReportStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  const { label, classes, Icon } = config;
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${classes} ${sizeClasses}`}>
      <Icon className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      {label}
    </span>
  );
}
