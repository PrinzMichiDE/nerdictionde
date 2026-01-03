import { NextResponse } from "next/server";

/**
 * Standard API Response Types
 * Ensures consistent response format across all API endpoints
 */

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    timestamp?: string;
    [key: string]: unknown;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    path?: string;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Standard HTTP Error Codes
 */
export enum HttpErrorCode {
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

/**
 * Create a successful API response
 */
export function successResponse<T>(
  data: T,
  meta?: ApiSuccessResponse<T>["meta"],
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json<ApiSuccessResponse<T>>(
    {
      success: true,
      data,
      meta: {
        ...meta,
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

/**
 * Create an error API response
 */
export function errorResponse(
  code: HttpErrorCode | string,
  message: string,
  details?: unknown,
  status: number = 400,
  path?: string
): NextResponse<ApiErrorResponse> {
  return NextResponse.json<ApiErrorResponse>(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
      meta: {
        timestamp: new Date().toISOString(),
        ...(path && { path }),
      },
    },
    { status }
  );
}

/**
 * Common error responses
 */
export const ApiErrors = {
  badRequest: (message: string = "Bad Request", details?: unknown) =>
    errorResponse(HttpErrorCode.BAD_REQUEST, message, details, 400),
  
  unauthorized: (message: string = "Unauthorized") =>
    errorResponse(HttpErrorCode.UNAUTHORIZED, message, undefined, 401),
  
  forbidden: (message: string = "Forbidden") =>
    errorResponse(HttpErrorCode.FORBIDDEN, message, undefined, 403),
  
  notFound: (message: string = "Resource not found") =>
    errorResponse(HttpErrorCode.NOT_FOUND, message, undefined, 404),
  
  conflict: (message: string = "Resource conflict", details?: unknown) =>
    errorResponse(HttpErrorCode.CONFLICT, message, details, 409),
  
  validationError: (message: string = "Validation failed", details?: unknown) =>
    errorResponse(HttpErrorCode.VALIDATION_ERROR, message, details, 400),
  
  rateLimitExceeded: () =>
    errorResponse(
      HttpErrorCode.RATE_LIMIT_EXCEEDED,
      "Too many requests. Please try again later.",
      undefined,
      429
    ),
  
  internalServerError: (message: string = "Internal server error", details?: unknown) =>
    errorResponse(HttpErrorCode.INTERNAL_SERVER_ERROR, message, details, 500),
  
  serviceUnavailable: (message: string = "Service temporarily unavailable") =>
    errorResponse(HttpErrorCode.SERVICE_UNAVAILABLE, message, undefined, 503),
};
