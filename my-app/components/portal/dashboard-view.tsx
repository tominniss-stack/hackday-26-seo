'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  Target,
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  TrendingUp,
  FileText,
  Gauge,
  ShieldCheck
} from 'lucide-react';
import { formatReportTitle } from '@/lib/report-utils';

interface RecentReport {
  id: string;
  reporting_month: string;
  report_category: 'SEO' | 'PPC';
  published_status: 'published' | 'pending_approval' | 'draft';
  created_at: string;
}

interface DashboardNotification {
  id: string;
  type: 'report_published' | 'ticket_update';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface DashboardTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  created: string;
}

interface DashboardViewProps {
  clientColor: string;
  clientId: string;
  clientName: string;
  contactName?: string;
  accessKey?: string;
  /** Live data — default to empty arrays so the UI renders clean empty states
   *  instead of fabricated mock content when a source is not yet wired. */
  recentReports?: RecentReport[];
  notifications?: DashboardNotification[];
  activeTickets?: DashboardTicket[];
  /** Latest SEO technical-health score (0–100) + the month it was measured,
   *  shown alongside the DORA score. Null when no SEO report exists yet. */
  seoHealthScore?: number | null;
  seoHealthMonth?: string | null;
}

export function DashboardView({
  clientColor,
  clientId,
  clientName,
  contactName,
  accessKey,
  recentReports = [],
  notifications = [],
  activeTickets = [],
  seoHealthScore = null,
  seoHealthMonth = null,
}: DashboardViewProps) {
  const router = useRouter();

  // Extract first name from contact_name, fallback to company name.
  // Guards against null, empty, or whitespace-only contact names.
  const getGreetingName = () => {
    const trimmed = contactName?.trim();
    if (trimmed) {
      const firstName = trimmed.split(/\s+/)[0];
      if (firstName) return firstName;
    }
    return clientName;
  };

  const handleViewReport = (reportId: string, category: 'SEO' | 'PPC') => {
    const view = category.toLowerCase();
    router.push(`/report/${reportId}?view=${view}&key=${accessKey}`);
  };
  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      pending_approval: 'bg-amber-50 text-amber-700 border-amber-200',
      draft: 'bg-slate-100 text-slate-600 border-slate-200',
    };
    return variants[status] || variants.draft;
  };

  const getCategoryIcon = (category: 'SEO' | 'PPC') => {
    return category === 'SEO' ? BarChart3 : Target;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'report_published':
        return CheckCircle2;
      case 'ticket_update':
        return AlertCircle;
      default:
        return Bell;
    }
  };

  return (
    <div className="space-y-6">
      {/* Brew Digital Branding Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {getGreetingName()}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Your performance dashboard powered by Brew Digital
          </p>
        </div>
        <div className="flex items-center gap-2">
          <img
            src="https://cdn.prod.website-files.com/66e0e7ec6b3ae01699e44a8c/66e0e7ec6b3ae01699e44b0e_brew-digital-logo.svg"
            alt="Brew Digital"
            className="h-8"
            // Hide gracefully if the external asset fails so the header layout never collapses.
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Active Reports</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{recentReports.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Open Requests</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{activeTickets.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Unread Alerts</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {notifications.filter(n => !n.read).length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center">
                <Bell className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports Grid */}
      <Card className="border-l-4" style={{ borderLeftColor: clientColor }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Reports</CardTitle>
            <Button variant="ghost" size="sm">
              View All
              <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentReports.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No reports published yet
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentReports.map((report) => {
              const Icon = getCategoryIcon(report.report_category);
              return (
                <Card 
                  key={report.id}
                  className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-slate-300"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-10 w-10 rounded-lg flex items-center justify-center"
                          style={{ 
                            backgroundColor: report.report_category === 'SEO' ? '#dbeafe' : '#fce7f3',
                          }}
                        >
                          <Icon 
                            className="h-5 w-5"
                            style={{ 
                              color: report.report_category === 'SEO' ? '#2563eb' : '#ec4899',
                            }}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-slate-900">
                            {formatReportTitle(report.reporting_month, report.report_category)}
                          </h3>
                          <p className="text-xs text-slate-500">
                            Published {new Date(report.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusBadge(report.published_status)}>
                        {report.published_status === 'published' ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      style={{ borderColor: clientColor, color: clientColor }}
                      onClick={() => handleViewReport(report.id, report.report_category)}
                    >
                      View Report
                      <TrendingUp className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          )}
        </CardContent>
      </Card>

      {/* Two Column Layout: Notifications + Active Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications Pane */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.length === 0 && (
                <div className="py-6 text-center text-sm text-slate-500">
                  No new notifications
                </div>
              )}
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${
                      notification.read 
                        ? 'bg-white border-slate-100' 
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        notification.type === 'report_published' 
                          ? 'bg-emerald-100' 
                          : 'bg-blue-100'
                      }`}>
                        <Icon className={`h-4 w-4 ${
                          notification.type === 'report_published' 
                            ? 'text-emerald-600' 
                            : 'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">
                          {notification.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {notification.timestamp}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Active Requests Board */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Active Requests
              </CardTitle>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeTickets.length === 0 && (
                <div className="py-6 text-center text-sm text-slate-500">
                  No active requests
                </div>
              )}
              {activeTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-mono">
                        {ticket.id}
                      </Badge>
                      <Badge 
                        className={
                          ticket.priority === 'High' 
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }
                      >
                        {ticket.priority}
                      </Badge>
                    </div>
                    <Badge 
                      className={
                        ticket.status === 'In Progress'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }
                    >
                      {ticket.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-slate-900 mb-1">
                    {ticket.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    Created {ticket.created}
                  </p>
                </div>
              ))}
              
              <Button 
                variant="outline" 
                className="w-full mt-3"
                style={{ borderColor: clientColor, color: clientColor }}
              >
                Submit New Request
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maturity row: Digital Maturity (DORA) + SEO Technical Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Digital Maturity (DORA) — 2/3 */}
        <Card className="border-l-4 lg:col-span-2" style={{ borderLeftColor: clientColor }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Gauge className="h-4 w-4" style={{ color: clientColor }} />
                  Digital Maturity (DORA)
                </CardTitle>
                <p className="text-xs text-slate-500 mt-1">
                  Your Digital Readiness Assessment monitors the maturity of your infrastructure and operations.
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                Last Assessed: 12 Jun 2026
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight tabular-nums text-slate-900">68</span>
                <span className="text-sm text-slate-400">/ 100</span>
              </div>
              <div className="flex-1 max-w-xs">
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: '68%', backgroundColor: clientColor }} />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Healthy — above the industry benchmark of 60.
                </p>
              </div>
              <Button size="sm" style={{ backgroundColor: clientColor }} className="text-white shrink-0">
                Retake Assessment
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* SEO Technical Health — 1/3, mirrors the latest report's score */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck
                className="h-4 w-4"
                style={{
                  color:
                    seoHealthScore == null ? '#94a3b8'
                      : seoHealthScore >= 90 ? '#059669'
                      : seoHealthScore >= 70 ? '#b45309'
                      : '#dc2626',
                }}
              />
              SEO Technical Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            {seoHealthScore == null ? (
              <p className="text-sm text-slate-400">No SEO report published yet.</p>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="text-4xl font-bold tracking-tight tabular-nums"
                    style={{
                      color:
                        seoHealthScore >= 90 ? '#059669'
                          : seoHealthScore >= 70 ? '#b45309'
                          : '#dc2626',
                    }}
                  >
                    {Math.round(seoHealthScore)}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Correct as of {seoHealthMonth ? new Date(seoHealthMonth).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'the latest report'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* More from Brew — content ecosystem */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Latest from the Resource Hub */}
        <Card className="overflow-hidden group">
          <a
            href="https://brewdigital.com/resource-hub"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <div className="h-40 w-full overflow-hidden bg-slate-100">
              <img
                src="/marketing/seo-health.png"
                alt="Running an SEO health check"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <CardContent className="pt-4">
              <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: clientColor }}>
                Latest from the Resource Hub
              </p>
              <h3 className="text-sm font-semibold text-slate-900 mt-1 leading-snug">
                Your Site&apos;s Annual Check-up: A Practical SEO Health Check Guide
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Spot crawl issues, indexation gaps and technical errors before they cost you rankings.
              </p>
            </CardContent>
          </a>
        </Card>

        {/* Latest Podcast Episode */}
        <Card className="overflow-hidden group">
          <a
            href="https://brewdigital.com/podcast"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <div className="h-40 w-full overflow-hidden bg-slate-900">
              <img
                src="/marketing/motu-podcast.png"
                alt="Marketers of the Universe — a Brew Digital podcast"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <CardContent className="pt-4">
              <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: clientColor }}>
                Latest Podcast Episode
              </p>
              <h3 className="text-sm font-semibold text-slate-900 mt-1 leading-snug">
                Marketers of the Universe — Decoding Digital Maturity
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Our team unpacks how the best brands turn operational readiness into marketing advantage.
              </p>
            </CardContent>
          </a>
        </Card>
      </div>
    </div>
  );
}
