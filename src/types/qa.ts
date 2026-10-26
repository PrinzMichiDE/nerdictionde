import { QAStatus } from '@prisma/client';

/**
 * TypeScript Types für Community Q&A Feature
 * Ergänzt die Zod-inferierten Types um UI-spezifische Types
 */

// ============================================
// Basis Types (aus Prisma / Zod)
// ============================================

export type { QAStatus };

export interface QAAuthor {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl: string | null;
}

export interface QAQuestionBase {
  id: string;
  title: string;
  body: string | null;
  status: QAStatus;
  score: number;
  answerCount: number;
  acceptedAnswerId: string | null;
  author: QAAuthor;
  createdAt: Date;
  updatedAt: Date;
  editedAt: Date | null;
  deletedAt: Date | null;
}

export interface QAAnswerBase {
  id: string;
  questionId: string;
  body: string;
  score: number;
  isAccepted: boolean;
  author: QAAuthor;
  createdAt: Date;
  updatedAt: Date;
  editedAt: Date | null;
  deletedAt: Date | null;
}

// ============================================
// UI Types (mit User-spezifischen Daten)
// ============================================

/** Frage in der Liste (mit Antworten, mit User-Vote) */
export interface QAQuestionListItem extends QAQuestionBase {
  userVote: 1 | -1 | null;
  answers: QAAnswerWithUserVote[];
}

/** Frage im Detail (mit Antworten, mit User-Vote) */
export interface QAQuestionDetail extends QAQuestionBase {
  answers: QAAnswerWithUserVote[];
  userVote: 1 | -1 | null;
}

/** Antwort mit User-Vote Info */
export interface QAAnswerWithUserVote extends QAAnswerBase {
  userVote: 1 | -1 | null;
}

/** Antwort für Formulare (nur Body) */
export interface QAAnswerFormData {
  body: string;
}

/** Frage für Formulare */
export interface QAQuestionFormData {
  title: string;
  body?: string;
}

/** Vote Status für UI */
export type QAVoteValue = 1 | -1 | 0 | null;

/** Paginierte QA Liste Response */
export interface QAListResponse {
  questions: QAQuestionListItem[];
  nextCursor: string | null;
  totalCount: number;
}

/** Single Question Response (für Create/Update) */
export interface QAQuestionResponse {
  question: QAQuestionListItem;
}

/** Single Answer Response (für Create/Update) */
export interface QAAnswerResponse {
  answer: QAAnswerWithUserVote;
}

/** Vote Response */
export interface QAVoteResponse {
  success: true;
  score: number;
  userVote: QAVoteValue;
}

/** Accept Answer Response */
export interface QAAcceptAnswerResponse {
  success: true;
  acceptedAnswerId: string | null;
  status: QAStatus;
}

// ============================================
// Hook Return Types
// ============================================

export interface UseQAListReturn {
  questions: QAQuestionListItem[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  nextCursor: string | null;
  totalCount: number;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  refetch: () => Promise<void>;
}

export interface UseQAMutationsReturn {
  createQuestion: (data: QAQuestionFormData) => Promise<QAQuestionListItem>;
  updateQuestion: (questionId: string, data: Partial<QAQuestionFormData>) => Promise<QAQuestionListItem>;
  deleteQuestion: (questionId: string) => Promise<void>;
  createAnswer: (questionId: string, data: QAAnswerFormData) => Promise<QAAnswerWithUserVote>;
  updateAnswer: (questionId: string, answerId: string, data: QAAnswerFormData) => Promise<QAAnswerWithUserVote>;
  deleteAnswer: (questionId: string, answerId: string) => Promise<void>;
  acceptAnswer: (questionId: string, answerId: string) => Promise<QAAcceptAnswerResponse>;
  isMutating: boolean;
}

export interface UseQAVoteReturn {
  vote: (value: 1 | -1 | 0) => Promise<void>;
  score: number;
  userVote: QAVoteValue;
  isVoting: boolean;
}

export interface UseQAAnswerVoteReturn {
  vote: (value: 1 | -1 | 0) => Promise<void>;
  score: number;
  userVote: QAVoteValue;
  isVoting: boolean;
}

// ============================================
// Component Props Types
// ============================================

export interface QAListProps {
  reviewSlug: string;
  initialData?: QAListResponse;
  className?: string;
}

export interface QAQuestionProps {
  question: QAQuestionListItem;
  onVote?: (value: 1 | -1 | 0) => Promise<void>;
  onDelete?: () => Promise<void>;
  onEdit?: (data: Partial<QAQuestionFormData>) => Promise<void>;
  isOwnQuestion: boolean;
  className?: string;
}

export interface QAAnswersProps {
  answers: QAAnswerWithUserVote[];
  questionAuthorId: string;
  currentUserId: string | null;
  onVote: (answerId: string, value: 1 | -1 | 0) => Promise<void>;
  onAccept: (answerId: string) => Promise<void>;
  onDelete: (answerId: string) => Promise<void>;
  onEdit: (answerId: string, data: QAAnswerFormData) => Promise<void>;
  acceptedAnswerId: string | null;
  className?: string;
}

export interface QAQuestionFormProps {
  reviewSlug: string;
  onSuccess: (question: QAQuestionListItem) => void;
  onCancel: () => void;
  initialData?: Partial<QAQuestionFormData>;
  className?: string;
}

export interface QAAnswerFormProps {
  questionId: string;
  answer?: QAAnswerWithUserVote | null; // null = create, defined = edit
  onSuccess: (answer: QAAnswerWithUserVote) => void;
  onCancel: () => void;
  className?: string;
}

export interface QAVoteButtonsProps {
  score: number;
  userVote: QAVoteValue;
  onVote: (value: 1 | -1 | 0) => Promise<void>;
  disabled?: boolean;
  ariaLabelUpvote: string;
  ariaLabelDownvote: string;
  className?: string;
}

export interface QAEmptyStateProps {
  onAskQuestion: () => void;
  className?: string;
}

export interface QASkeletonProps {
  count?: number;
  className?: string;
}

// ============================================
// Notification Types (für Integration)
// ============================================

export type QANotificationType =
  | 'qa_new_question'
  | 'qa_answer_added'
  | 'qa_answer_accepted';

export interface QANotificationData {
  questionId: string;
  questionTitle: string;
  reviewSlug: string;
  reviewTitle: string;
  actorId: string;
  actorDisplayName: string;
  answerId?: string;
}

// ============================================
// Feature Flag
// ============================================

export const FEATURE_COMMUNITY_QA = 'FEATURE_COMMUNITY_QA';

export function isCommunityQAEnabled(): boolean {
  return process.env.FEATURE_COMMUNITY_QA !== 'false';
}