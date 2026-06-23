'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Save, Loader2, Settings, Users, Shield } from 'lucide-react';

// Mock team members data
const MOCK_TEAM_MEMBERS = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    role: 'Senior SEO Analyst',
    can_approve: true,
    active: true,
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike@example.com',
    role: 'SEO Analyst',
    can_approve: false,
    active: true,
  },
  {
    id: '3',
    name: 'Emma Williams',
    email: 'emma@example.com',
    role: 'Account Manager',
    can_approve: true,
    active: true,
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('system');
  const [globalPrompt, setGlobalPrompt] = useState('');
  const [priorityWeights, setPriorityWeights] = useState({
    internal_linking: 100,
    errors_404: 80,
    redirects_302: 60,
    errors_5xx: 90,
    missing_h1: 40,
    non_indexable: 50,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'global_system_prompt')
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        if (data) setGlobalPrompt((data as { value: string }).value || '');

        // Fetch priority weights
        const { data: weightsData, error: weightsError } = await (supabase as any)
          .from('app_settings')
          .select('value_json')
          .eq('key', 'priority_weights')
          .single();
        
        if (weightsError && weightsError.code !== 'PGRST116') throw weightsError;
        if (weightsData?.value_json) {
          setPriorityWeights(weightsData.value_json as any);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('app_settings')
        .upsert({ key: 'global_system_prompt', value: globalPrompt }, { onConflict: 'key' });
        
      if (error) throw error;

      // Save priority weights
      const { error: weightsError } = await (supabase as any)
        .from('app_settings')
        .upsert({ key: 'priority_weights', value_json: priorityWeights }, { onConflict: 'key' });
      
      if (weightsError) throw weightsError;

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin')} className="mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Hub
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-slate-900 flex items-center justify-center text-white shrink-0">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Settings</h1>
            <p className="text-sm text-slate-500 mt-1">Configure system-wide settings and manage team access</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              System Settings
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="space-y-6">
            <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Global AI System Prompt</CardTitle>
                <p className="text-xs text-slate-500 mt-1">
                  This base prompt is injected into every AI generation request across all clients. Use it to enforce agency tone of voice and formatting rules.
                </p>
              </div>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                )}
                {saved ? 'Saved!' : 'Save Prompt'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="globalPrompt" className="sr-only">Global System Prompt</Label>
              <Textarea
                id="globalPrompt"
                value={globalPrompt}
                onChange={(e) => setGlobalPrompt(e.target.value)}
                rows={15}
                className="font-mono text-sm leading-relaxed"
                placeholder="Enter the global system prompt..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Priority Matrix Weights</CardTitle>
                <p className="text-xs text-slate-500 mt-1">
                  Configure the ranking weights for the Top Actionable Priorities engine. Higher values = higher priority (0-100).
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight_internal_linking" className="text-xs font-medium">
                  Internal Linking Issues
                </Label>
                <Input
                  id="weight_internal_linking"
                  type="number"
                  value={priorityWeights.internal_linking}
                  onChange={(e) => setPriorityWeights(prev => ({
                    ...prev,
                    internal_linking: parseInt(e.target.value) || 0
                  }))}
                  min="0"
                  max="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight_errors_404" className="text-xs font-medium">
                  404 Client Errors
                </Label>
                <Input
                  id="weight_errors_404"
                  type="number"
                  value={priorityWeights.errors_404}
                  onChange={(e) => setPriorityWeights(prev => ({
                    ...prev,
                    errors_404: parseInt(e.target.value) || 0
                  }))}
                  min="0"
                  max="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight_redirects_302" className="text-xs font-medium">
                  302 Redirect Chains
                </Label>
                <Input
                  id="weight_redirects_302"
                  type="number"
                  value={priorityWeights.redirects_302}
                  onChange={(e) => setPriorityWeights(prev => ({
                    ...prev,
                    redirects_302: parseInt(e.target.value) || 0
                  }))}
                  min="0"
                  max="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight_errors_5xx" className="text-xs font-medium">
                  5xx Server Errors
                </Label>
                <Input
                  id="weight_errors_5xx"
                  type="number"
                  value={priorityWeights.errors_5xx}
                  onChange={(e) => setPriorityWeights(prev => ({
                    ...prev,
                    errors_5xx: parseInt(e.target.value) || 0
                  }))}
                  min="0"
                  max="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight_missing_h1" className="text-xs font-medium">
                  Missing H1 Tags
                </Label>
                <Input
                  id="weight_missing_h1"
                  type="number"
                  value={priorityWeights.missing_h1}
                  onChange={(e) => setPriorityWeights(prev => ({
                    ...prev,
                    missing_h1: parseInt(e.target.value) || 0
                  }))}
                  min="0"
                  max="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight_non_indexable" className="text-xs font-medium">
                  Non-Indexable Pages
                </Label>
                <Input
                  id="weight_non_indexable"
                  type="number"
                  value={priorityWeights.non_indexable}
                  onChange={(e) => setPriorityWeights(prev => ({
                    ...prev,
                    non_indexable: parseInt(e.target.value) || 0
                  }))}
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Agency Team Members
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-1">
                      Manage team access and approval permissions for report publishing
                    </p>
                  </div>
                  <Button size="sm">
                    Add Team Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Approval Rights</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_TEAM_MEMBERS.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell className="text-sm text-slate-600">{member.email}</TableCell>
                        <TableCell className="text-sm">{member.role}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {member.can_approve ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                Can Approve
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-slate-500">
                                No Approval
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={member.active
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                            }
                          >
                            {member.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">About Approval Permissions</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Team members with approval rights can publish reports directly to clients.
                        Those without approval rights can only create drafts that require review.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
