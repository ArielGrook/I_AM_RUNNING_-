'use client';

import { useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

export interface MediaFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: 'image' | 'video';
  createdAt: string;
}

export function useMediaLibrary(userId: string) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const supabase = getSupabaseClient();

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('media')
        .list(`${userId}/`, {
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) throw error;

      const mediaFiles: MediaFile[] = (data ?? []).map((file) => {
        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(`${userId}/${file.name}`);

        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        const isVideo = ['mp4', 'webm', 'mov'].includes(ext);

        return {
          id: file.id ?? file.name,
          name: file.name,
          url: urlData.publicUrl,
          size: file.metadata?.size ?? 0,
          type: isVideo ? 'video' : 'image',
          createdAt: file.created_at ?? '',
        };
      });

      setFiles(mediaFiles);
    } catch (err) {
      console.error('fetchFiles error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  const uploadFile = useCallback(
    async (file: File): Promise<string | null> => {
      setUploading(true);
      try {
        const ext = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const path = `${userId}/${fileName}`;

        let fileToUpload: File = file;
        if (file.type.startsWith('image/') && file.size > 500_000) {
          fileToUpload = await compressImage(file, 1920);
        }

        const { error } = await supabase.storage
          .from('media')
          .upload(path, fileToUpload, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(path);

        await fetchFiles();
        return urlData.publicUrl;
      } catch (err) {
        console.error('uploadFile error:', err);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [userId, fetchFiles, supabase]
  );

  const deleteFile = useCallback(
    async (fileName: string) => {
      const { error } = await supabase.storage
        .from('media')
        .remove([`${userId}/${fileName}`]);
      if (!error) await fetchFiles();
    },
    [userId, fetchFiles, supabase]
  );

  return { files, uploading, loading, fetchFiles, uploadFile, deleteFile };
}

async function compressImage(file: File, maxSize: number): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          resolve(
            blob
              ? new File([blob], file.name, { type: 'image/jpeg' })
              : file
          );
        },
        'image/jpeg',
        0.85
      );
    };
    img.src = url;
  });
}
