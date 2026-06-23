'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, User, Users, MessageSquare, Save, Loader2, UserPlus } from 'lucide-react';
import { uploadUserAvatar } from '@/lib/storage-helpers';

interface SettingsViewProps {
  clientColor: string;
  clientId: string;
}

export function SettingsView({ clientColor, clientId }: SettingsViewProps) {
  // My Profile State
  const [userId, setUserId] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    avatarUrl: '',
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Load the primary client_users profile for this client so the avatar/name
  // persist and round-trip. (Pre-auth: we use the first user row for the client.)
  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      const { data } = await supabase
        .from('client_users')
        .select('id, name, email, avatar_url')
        .eq('client_id', clientId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      const row = data as { id: string; name: string; email: string; avatar_url: string | null } | null;
      if (row) {
        setUserId(row.id);
        setProfileForm({ name: row.name ?? '', email: row.email ?? '', avatarUrl: row.avatar_url ?? '' });
      }
    }
    loadProfile();
    return () => { cancelled = true; };
  }, [clientId]);

  // Team Members (mock data)
  const [teamMembers] = useState([
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Member' },
  ]);

  const onDropAvatar = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploadingAvatar(true);

    try {
      const result = await uploadUserAvatar(userId ?? clientId, file);

      if (!result) throw new Error('Upload failed');

      setProfileForm(prev => ({ ...prev, avatarUrl: result.url }));

      // Persist immediately so the avatar survives a refresh.
      if (userId) {
        await (supabase as any)
          .from('client_users')
          .update({ avatar_url: result.url })
          .eq('id', userId);
      }
      toast.success('Avatar uploaded');
    } catch (err) {
      console.error('Error uploading avatar:', err);
      toast.error('Failed to upload avatar. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  }, [userId, clientId]);

  const { getRootProps: getAvatarRootProps, getInputProps: getAvatarInputProps, isDragActive: isAvatarDragActive } = useDropzone({
    onDrop: onDropAvatar,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
    },
    maxSize: 2097152, // 2MB
    multiple: false,
  });

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      if (!userId) {
        toast.error('No profile found to update for this client.');
        return;
      }
      const { error } = await (supabase as any)
        .from('client_users')
        .update({ name: profileForm.name, avatar_url: profileForm.avatarUrl || null })
        .eq('id', userId);
      if (error) throw error;
      toast.success('Profile updated');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed to save profile: ${msg}`);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleInviteUser = () => {
    alert('Invite user functionality will be implemented with email integration');
  };

  return (
    <div className="space-y-6">
      {/* My Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" style={{ color: clientColor }} />
            <CardTitle className="text-base">My Profile</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar Upload */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Profile Avatar</Label>
            <div className="flex items-center gap-4">
              {profileForm.avatarUrl ? (
                <img
                  src={profileForm.avatarUrl}
                  alt="Avatar"
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-slate-100"
                />
              ) : (
                <div
                  className="h-16 w-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                  style={{ backgroundColor: clientColor }}
                >
                  {profileForm.name.charAt(0)}
                </div>
              )}
              <div
                {...getAvatarRootProps()}
                className={`flex-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                  isAvatarDragActive
                    ? 'border-slate-400 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300'
                } ${uploadingAvatar ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <input {...getAvatarInputProps()} />
                <Upload className="h-6 w-6 mx-auto mb-1 text-slate-400" />
                {uploadingAvatar ? (
                  <p className="text-xs text-slate-600">Uploading...</p>
                ) : isAvatarDragActive ? (
                  <p className="text-xs text-slate-600">Drop avatar here...</p>
                ) : (
                  <>
                    <p className="text-xs text-slate-600 mb-0.5">
                      Drop avatar or click to browse
                    </p>
                    <p className="text-[11px] text-slate-500">
                      PNG, JPG, WebP (max 2MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Name & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="profile_name" className="text-xs font-medium">Name</Label>
              <Input
                id="profile_name"
                value={profileForm.name}
                onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile_email" className="text-xs font-medium">Email</Label>
              <Input
                id="profile_email"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
                disabled
                className="bg-slate-50"
              />
              <p className="text-[11px] text-slate-500">Email cannot be changed</p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveProfile} disabled={savingProfile} size="sm">
              {savingProfile ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" style={{ color: clientColor }} />
              <CardTitle className="text-base">Team Members</CardTitle>
            </div>
            <Button size="sm" onClick={handleInviteUser}>
              <UserPlus className="h-4 w-4 mr-1.5" />
              Invite User
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell className="text-slate-600">{member.email}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      member.role === 'Admin'
                        ? 'bg-purple-50 text-purple-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {member.role}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-600">
              Team members can access this client portal and collaborate on reports. Invite colleagues to join your team.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Support Tickets */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" style={{ color: clientColor }} />
            <CardTitle className="text-base">Support Tickets</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-12 w-12 text-slate-200 mb-3" />
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              Support Tickets Coming Soon
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              View and manage support tickets for account management, technical issues, and general inquiries. This feature will be available soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
