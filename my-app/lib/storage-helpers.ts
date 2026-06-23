import { supabase } from './supabase';

/**
 * Storage Helpers for Supabase File Uploads
 * Handles client logos and user avatars
 */

export interface UploadResult {
  path: string;
  url: string;
}

/**
 * Upload a client logo to the client_logos bucket
 * @param clientId - Client UUID
 * @param file - File object to upload
 * @returns Upload result with path and public URL, or null on error
 */
export async function uploadClientLogo(
  clientId: string,
  file: File
): Promise<UploadResult | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${clientId}-${Date.now()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { data, error } = await supabase.storage
      .from('client_logos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('client_logos')
      .getPublicUrl(filePath);

    return { path: filePath, url: publicUrl };
  } catch (error) {
    console.error('Error uploading client logo:', error);
    return null;
  }
}

/**
 * Delete a client logo from storage
 * @param path - Storage path to delete
 * @returns True if successful, false otherwise
 */
export async function deleteClientLogo(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('client_logos')
      .remove([path]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting client logo:', error);
    return false;
  }
}

/**
 * Upload a user avatar to the user_avatars bucket
 * @param userId - User UUID
 * @param file - File object to upload
 * @returns Upload result with path and public URL, or null on error
 */
export async function uploadUserAvatar(
  userId: string,
  file: File
): Promise<UploadResult | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { data, error } = await supabase.storage
      .from('user_avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('user_avatars')
      .getPublicUrl(filePath);

    return { path: filePath, url: publicUrl };
  } catch (error) {
    console.error('Error uploading user avatar:', error);
    return null;
  }
}

/**
 * Delete a user avatar from storage
 * @param path - Storage path to delete
 * @returns True if successful, false otherwise
 */
export async function deleteUserAvatar(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('user_avatars')
      .remove([path]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting user avatar:', error);
    return false;
  }
}

/**
 * Get public URL for a storage path
 * @param bucket - Bucket name (client_logos or user_avatars)
 * @param path - Storage path
 * @returns Public URL
 */
export function getPublicUrl(bucket: 'client_logos' | 'user_avatars', path: string): string {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return publicUrl;
}

/**
 * Resolve logo URL from either external URL or storage path
 * @param logoUrl - External logo URL (if any)
 * @param logoStoragePath - Storage path (if any)
 * @returns Resolved logo URL or null
 */
export function resolveLogoUrl(
  logoUrl: string | null,
  logoStoragePath: string | null
): string | null {
  if (logoStoragePath) {
    return getPublicUrl('client_logos', logoStoragePath);
  }
  return logoUrl;
}
