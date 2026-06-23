'use client';

import { FileText, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MOCK_DOCUMENTS } from '@/lib/mock-data';

interface DocumentsViewProps {
  clientColor: string;
}

const TYPE_COLORS: Record<string, string> = {
  Contract: 'bg-blue-50 text-blue-700',
  Strategy: 'bg-purple-50 text-purple-700',
  Report: 'bg-emerald-50 text-emerald-700',
  Brand: 'bg-amber-50 text-amber-700',
};

export function DocumentsView({ clientColor }: DocumentsViewProps) {
  return (
    <div className="space-y-8">
      {/* Header — no time selector for timeless tabs */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Documents</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Shared files, contracts, and deliverables
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Shared Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden sm:table-cell">Size</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_DOCUMENTS.map((doc, index) => (
                <TableRow key={index} className="group">
                  <TableCell className="font-medium text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-slate-400" />
                      </div>
                      <span className="text-sm truncate">{doc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge
                      variant="secondary"
                      className={`border-0 text-[10px] ${TYPE_COLORS[doc.type] || 'bg-slate-50 text-slate-600'}`}
                    >
                      {doc.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs hidden sm:table-cell">
                    {doc.size}
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs hidden md:table-cell">
                    {doc.date}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
