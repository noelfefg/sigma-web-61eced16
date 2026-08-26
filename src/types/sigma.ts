/** Shared Sigma domain types used across the redesigned UI layer. */

export interface SigmaUser {
  id?: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
}

export interface SigmaStream {
  id: string;
  title: string;
  viewer_count: number;
  thumbnail_url?: string | null;
  is_live?: boolean;
  profiles: SigmaUser;
  categories?: { name: string; slug?: string } | null;
}

export interface SigmaStreamMessage {
  id: string;
  message: string;
  created_at: string;
  profiles: SigmaUser;
}

export type SigmaReaction = 'heart' | 'fire' | 'star' | 'clap';
