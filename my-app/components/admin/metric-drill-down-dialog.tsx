'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import Papa from 'papaparse';
import type { UrlEntry } from '@/lib/metrics-schema';

const PAGE_SIZE = 100;

type FilterType = '4xx' | '5xx' | '3xx' | 'non_indexable' | 'missing_h1';

interface MetricDrillDownDialogProps {
  children: React.ReactNode;
  title: string;
  count: number;
  /** Pre-loaded top-50 URLs (always available) */
  urls: UrlEntry[];
  /** Storage path for full CSV (enables infinite drill-down) */
  storagePath?: string;
  /** Which issue type to filter from the full CSV */
  filterType?: FilterType;
  badgeVariant?: 'destructive' | 'secondary' | 'default';
}

function filterRow(row: Record<string, string>, filterType: FilterType): boolean {
  const status = String(row['Status Code'] ?? '');
  switch (filterType) {
    case '4xx': return status.startsWith('4');
    case '5xx': return status.startsWith('5');
    case '3xx': return status.startsWith('3');
    case 'non_indexable': return row['Indexability'] === 'Non-Indexable';
    case 'missing_h1': return !row['H1-1'] || row['H1-1'].trim() === '';
    default: return true;
  }
}

function rowToEntry(row: Record<string, string>): UrlEntry {
  return {
    url: row['Address'] ?? row['URL'] ?? '',
    status_code: row['Status Code'] ? parseInt(row['Status Code'], 10) : undefined,
    title: row['Title 1'] ?? row['Title'] ?? undefined,
    h1: row['H1-1'] ?? undefined,
    indexability: row['Indexability'] ?? undefined,
  };
}

function UrlTable({ entries }: { entries: UrlEntry[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50%]">URL</TableHead>
          <TableHead className="hidden sm:table-cell">Status</TableHead>
          <TableHead className="hidden md:table-cell">Title</TableHead>
          <TableHead className="hidden lg:table-cell">Indexability</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry, i) => (
          <TableRow key={i}>
            <TableCell className="font-mono text-xs break-all max-w-xs">
              <a href={entry.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {entry.url}
              </a>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              {entry.status_code && (
                <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                  entry.status_code >= 500 ? 'bg-red-100 text-red-700'
                  : entry.status_code >= 400 ? 'bg-orange-100 text-orange-700'
                  : entry.status_code >= 300 ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-600'
                }`}>
                  {entry.status_code}
                </span>
              )}
            </TableCell>
            <TableCell className="text-xs text-slate-600 hidden md:table-cell max-w-[200px] truncate">
              {entry.title ?? '—'}
            </TableCell>
            <TableCell className="text-xs text-slate-500 hidden lg:table-cell">
              {entry.indexability ?? '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function MetricDrillDownDialog({
  children,
  title,
  count,
  urls,
  storagePath,
  filterType,
  badgeVariant = 'secondary',
}: MetricDrillDownDialogProps) {
  const [open, setOpen] = useState(false);
  const [allUrls, setAllUrls] = useState<UrlEntry[] | null>(null);
  const [loadingFull, setLoadingFull] = useState(false);
  const [page, setPage] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadFullCsv = useCallback(async () => {
    if (!storagePath || !filterType || allUrls !== null) return;
    setLoadingFull(true);
    setLoadError(null);
    try {
      const { data, error } = await supabase.storage
        .from('client_reports_data')
        .download(storagePath);
      if (error) throw error;

      const text = await data.text();
      const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
      const filtered = parsed.data
        .filter((row) => filterRow(row, filterType))
        .map(rowToEntry);
      setAllUrls(filtered);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load full CSV';
      setLoadError(msg);
    } finally {
      setLoadingFull(false);
    }
  }, [storagePath, filterType, allUrls]);

  useEffect(() => {
    if (open && storagePath && filterType) {
      loadFullCsv();
    }
  }, [open, loadFullCsv, storagePath, filterType]);

  if (!urls || urls.length === 0) {
    return <>{children}</>;
  }

  const displayUrls = allUrls ?? urls;
  const totalPages = Math.ceil(displayUrls.length / PAGE_SIZE);
  const pageUrls = displayUrls.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const isFullData = allUrls !== null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <div className="cursor-pointer w-full">
          {children}
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {title}
            <Badge variant={badgeVariant} className="text-xs">
              {(isFullData ? displayUrls.length : count).toLocaleString()} URLs
            </Badge>
            {isFullData && (
              <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700">
                Full dataset
              </Badge>
            )}
            {!isFullData && storagePath && (
              <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700">
                Top 50 shown
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {loadingFull && (
          <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading full dataset from storage...
          </div>
        )}

        {loadError && (
          <p className="text-xs text-red-600 py-2">
            Could not load full CSV: {loadError}. Showing top 50 results.
          </p>
        )}

        <div className="overflow-y-auto flex-1">
          <UrlTable entries={pageUrls} />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Page {page + 1} of {totalPages} · {displayUrls.length.toLocaleString()} total URLs
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {!isFullData && !storagePath && displayUrls.length >= 50 && (
          <p className="text-[11px] text-slate-500 text-center py-2">
            Showing top 50 URLs. Upload a new CSV to refresh.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
