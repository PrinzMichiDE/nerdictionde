// ============================================
// API Response Helpers
// ============================================

export interface ErrorResponseOptions {
  headers?: Headers;
  errors?: Record<string, string[]>;
  extra?: Record<string, unknown>;
}

export function successResponse<T>(
  data: T,
  headers?: Headers,
  status = 200
): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(data), { status, headers: responseHeaders });
}

export function errorResponse(
  message: string,
  status = 400,
  options: ErrorResponseOptions = {}
): Response {
  const responseHeaders = new Headers(options.headers);
  responseHeaders.set('Content-Type', 'application/json');
  const body = { error: message, ...options.extra };
  if (options.errors) {
    Object.assign(body, { errors: options.errors });
  }
  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
}