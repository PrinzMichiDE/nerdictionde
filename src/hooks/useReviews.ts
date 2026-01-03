import { useQuery } from "@tanstack/react-query";
import { Review } from "@/types/review";

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ApiResponse {
  success: boolean;
  data?: {
    reviews: Review[];
  };
  reviews?: Review[];
  pagination?: PaginationData;
  meta?: {
    pagination?: PaginationData;
  };
}

interface UseReviewsParams {
  query?: string;
  category?: string;
  sort?: string;
  minScore?: string;
  maxScore?: string;
  dateFilter?: string;
  page?: string;
  enabled?: boolean;
}

export function useReviews(params: UseReviewsParams) {
  const {
    query = "",
    category = "",
    sort = "date-desc",
    minScore = "",
    maxScore = "",
    dateFilter = "all",
    page = "1",
    enabled = true,
  } = params;

  const searchParams = new URLSearchParams();
  if (query) searchParams.set("query", query);
  if (category) searchParams.set("category", category);
  if (sort !== "date-desc") searchParams.set("sort", sort);
  if (minScore) searchParams.set("minScore", minScore);
  if (maxScore) searchParams.set("maxScore", maxScore);
  if (dateFilter !== "all") searchParams.set("dateFilter", dateFilter);
  if (page !== "1") searchParams.set("page", page);

  return useQuery<ApiResponse, Error>({
    queryKey: ["reviews", query, category, sort, minScore, maxScore, dateFilter, page],
    queryFn: async () => {
      const response = await fetch(`/api/reviews?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error("Fehler beim Laden der Reviews");
      }
      return response.json();
    },
    enabled,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
