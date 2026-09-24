// Shared domain types for Debait Club.

export type Side = 'for' | 'against';
export type Stance =
  | 'strongly_agree'
  | 'agree'
  | 'neutral'
  | 'disagree'
  | 'strongly_disagree';
export type TargetType = 'case' | 'comment';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface TopicSource {
  title: string;
  url: string;
}

export interface Topic {
  id: number;
  proposition: string;
  category: string;
  context: string | null;
  sources: TopicSource[];
  topic_date: string;
  is_featured: boolean;
  created_at: string;
}

export interface CaseRow {
  id: number;
  topic_id: number;
  side: Side;
  author_id: string | null;
  body: string;
  score: number;
  created_at: string;
  author: Pick<Profile, 'username' | 'display_name'> | null;
  comment_count: number;
  voted: boolean;
  saved: boolean;
}

export interface CommentRow {
  id: number;
  case_id: number;
  author_id: string | null;
  parent_id: number | null;
  body: string;
  stance: Stance;
  score: number;
  created_at: string;
  author: Pick<Profile, 'username' | 'display_name'> | null;
  voted: boolean;
  saved: boolean;
  replies: CommentRow[];
}

export const STANCE_LABELS: Record<Stance, string> = {
  strongly_agree: 'Strongly agree',
  agree: 'Agree',
  neutral: 'Neutral',
  disagree: 'Disagree',
  strongly_disagree: 'Strongly disagree',
};

export const STANCES: Stance[] = [
  'strongly_agree',
  'agree',
  'neutral',
  'disagree',
  'strongly_disagree',
];

export const MAX_BODY_LENGTH = 1680;

export const CATEGORIES = [
  'Featured',
  'Business',
  'Entertainment',
  'Lifestyle',
  'Politics',
  'Sports',
] as const;
