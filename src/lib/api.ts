/**
 * api.ts
 * Central API client for all calls to the Sigma Express backend.
 * Import this in pages/components instead of calling fetch() directly.
 */
import { supabase } from '@/integrations/supabase/client';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// ── Helper: get current JWT from Supabase session ─────────
async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

// ── Base fetch wrapper ─────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ══════════════════════════════════════════════════════════
// VIDEO APIs
// ══════════════════════════════════════════════════════════

export interface VideoItem {
  _id: string;
  supabaseUserId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  title: string;
  description: string;
  category: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: number;
  viewCount: number;
  likeCount: number;
  type: 'video' | 'short' | 'clip';
  tags: string[];
  createdAt: string;
}

interface VideosResponse {
  videos: VideoItem[];
  total: number;
  page: number;
  limit: number;
}

export const videosApi = {
  /** Get list of videos */
  list: (params?: {
    type?: 'video' | 'short' | 'clip';
    category?: string;
    search?: string;
    userId?: string;
    limit?: number;
    page?: number;
  }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return apiFetch<VideosResponse>(`/api/videos${qs ? `?${qs}` : ''}`);
  },

  /** Get single video by Mongo _id */
  get: (id: string) => apiFetch<VideoItem>(`/api/videos/${id}`),

  /** Create video record AFTER uploading file to Supabase Storage */
  create: (payload: {
    title: string;
    description?: string;
    category?: string;
    videoUrl: string;
    thumbnailUrl?: string;
    duration?: number;
    type?: 'video' | 'short' | 'clip';
    tags?: string[];
    streamId?: string;
  }) =>
    apiFetch<VideoItem>('/api/videos', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** Update video metadata */
  update: (
    id: string,
    payload: Partial<Pick<VideoItem, 'title' | 'description' | 'category' | 'thumbnailUrl' | 'tags'>>
  ) =>
    apiFetch<VideoItem>(`/api/videos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  /** Delete video */
  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/videos/${id}`, { method: 'DELETE' }),
};

// ══════════════════════════════════════════════════════════
// STREAM APIs
// ══════════════════════════════════════════════════════════

export interface LiveStream {
  id: string;
  title: string;
  description: string | null;
  viewer_count: number;
  thumbnail_url: string | null;
  started_at: string;
  profiles: { id: string; username: string; display_name: string; avatar_url: string | null };
  categories: { name: string; slug: string } | null;
}

export const streamsApi = {
  /** Get all currently live streams */
  getLive: () => apiFetch<{ streams: LiveStream[] }>('/api/streams/live'),

  /** Start a new live stream */
  start: (payload: { title: string; description?: string; categoryId?: string; tags?: string[] }) =>
    apiFetch<{ stream: LiveStream; meta: unknown }>('/api/streams/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** End a live stream */
  end: (streamId: string, payload?: { vodUrl?: string; thumbnailUrl?: string }) =>
    apiFetch<{ stream: LiveStream }>(`/api/streams/${streamId}/end`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    }),

  /** Notify server user joined/left stream (+1 / -1 delta) */
  updateViewers: (streamId: string, delta: 1 | -1) =>
    apiFetch<{ success: boolean }>(`/api/streams/${streamId}/viewers`, {
      method: 'PATCH',
      body: JSON.stringify({ delta }),
    }),

  /** Get stream analytics from MongoDB */
  getStats: (streamId: string) => apiFetch(`/api/streams/${streamId}/stats`),
};

// ══════════════════════════════════════════════════════════
// UPLOAD HELPERS
// ══════════════════════════════════════════════════════════

interface SignedUrlResponse {
  signedUrl: string;
  path: string;
  publicUrl: string;
  token?: string;
}

export const uploadApi = {
  /**
   * Get a signed URL, then upload directly to Supabase Storage.
   * Returns the public URL of the uploaded file.
   */
  async uploadFile(
    file: File,
    bucket: 'videos' | 'clips' = 'videos',
    onProgress?: (pct: number) => void
  ): Promise<string> {
    // 1. Get signed URL from our backend
    const signed = await apiFetch<SignedUrlResponse>('/api/upload/sign', {
      method: 'POST',
      body: JSON.stringify({ bucket, fileName: file.name }),
    });

    // 2. Upload directly to Supabase Storage via signed URL
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', signed.signedUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };
      }
      xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
      xhr.onerror = () => reject(new Error('Upload error'));
      xhr.send(file);
    });

    return signed.publicUrl;
  },

  /** Upload a thumbnail image */
  async uploadThumbnail(file: File): Promise<string> {
    const signed = await apiFetch<SignedUrlResponse>('/api/upload/thumbnail-sign', {
      method: 'POST',
      body: JSON.stringify({ fileName: file.name }),
    });

    await fetch(signed.signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    return signed.publicUrl;
  },
};
