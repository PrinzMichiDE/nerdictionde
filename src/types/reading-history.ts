export interface ReadingHistoryEntry {
  review: {
    id: string;
    slug: string;
    title: string;
    category: string;
    images: string[];
    score: number;
  };
  progress: number;
  scrollDepth: number;
  dwellTime: number;
  lastReadAt: string;
}

export interface ReadingHistoryResponse {
  items: ReadingHistoryEntry[];
  nextCursor: string | null;
}

export interface TrackReadingRequest {
  reviewId: string;
  progress: number;
  scrollDepth: number;
  dwellTime: number;
}

export interface TrackReadingResponse {
  success: boolean;
  entry: {
    id: string;
    userId: string;
    reviewId: string;
    progress: number;
    scrollDepth: number;
    dwellTime: number;
    lastReadAt: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface DeleteReadingHistoryResponse {
  success: boolean;
  deletedCount?: number;
}