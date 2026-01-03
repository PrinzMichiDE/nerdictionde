import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiErrors, errorResponse, HttpErrorCode } from "./api-response";

/**
 * Wrapper for API route handlers with standardized error handling
 */
export function apiHandler<T>(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse<T>>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        return ApiErrors.validationError(
          "Validation failed",
          error.errors.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          }))
        );
      }

      // Handle known error types
      if (error instanceof Error) {
        // Log error for debugging (in production, use proper logging service)
        console.error(`API Error [${req.nextUrl.pathname}]:`, {
          message: error.message,
          stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        });

        // Check for specific error types
        if (error.message.includes("not found")) {
          return ApiErrors.notFound(error.message);
        }

        if (error.message.includes("unauthorized") || error.message.includes("Unauthorized")) {
          return ApiErrors.unauthorized(error.message);
        }

        if (error.message.includes("forbidden") || error.message.includes("Forbidden")) {
          return ApiErrors.forbidden(error.message);
        }

        // Generic error response
        return ApiErrors.internalServerError(
          process.env.NODE_ENV === "production"
            ? "An unexpected error occurred"
            : error.message
        );
      }

      // Unknown error type
      return ApiErrors.internalServerError("An unexpected error occurred");
    }
  };
}

/**
 * Validate request body with Zod schema
 */
export function validateBody<T>(schema: any) {
  return async (req: NextRequest): Promise<T> => {
    try {
      const body = await req.json();
      return schema.parse(body);
    } catch (error) {
      throw error;
    }
  };
}

/**
 * Validate query parameters with Zod schema
 */
export function validateQuery<T>(schema: any) {
  return (req: NextRequest): T => {
    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    return schema.parse(searchParams);
  };
}
