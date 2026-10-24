export type ReactionType = 'THUMBS_UP' | 'HEART' | 'PARTY' | 'THINKING' | 'CRY' | 'ANGRY';

export const REACTION_TYPES: ReactionType[] = [
  'THUMBS_UP',
  'HEART',
  'PARTY',
  'THINKING',
  'CRY',
  'ANGRY',
];

export const REACTION_EMOJIS: Record<ReactionType, string> = {
  THUMBS_UP: '👍',
  HEART: '❤️',
  PARTY: '🎉',
  THINKING: '🤔',
  CRY: '😢',
  ANGRY: '😡',
};

export const REACTION_LABELS_DE: Record<ReactionType, string> = {
  THUMBS_UP: 'Hilfreich',
  HEART: 'Liebe es',
  PARTY: 'Feiern',
  THINKING: 'Nachdenklich',
  CRY: 'Traurig',
  ANGRY: 'Wütend',
};

export interface ReactionCounts {
  THUMBS_UP: number;
  HEART: number;
  PARTY: number;
  THINKING: number;
  CRY: number;
  ANGRY: number;
}

export interface ReviewReactionsResponse {
  counts: ReactionCounts;
  total: number;
  myReaction: ReactionType | null;
}

export interface ToggleReactionRequest {
  type: ReactionType;
}

export interface ToggleReactionResponse {
  success: boolean;
  counts: ReactionCounts;
  total: number;
  myReaction: ReactionType | null;
}