import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse, NextRequest } from "next/server";
import { requireAdminAuth } from "@/lib/auth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Require admin authentication
  const authError = requireAdminAuth(request);
  if (authError) return authError;

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (
        pathname: string,
        clientPayload: string | null,
        multipart: boolean
      ) => {
        // Authentifizierung bereits durch requireAdminAuth gehandhabt
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
          tokenPayload: JSON.stringify({
            // Optionaler Payload
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Optional: DB-Update nach dem Upload
        console.log("Upload completed:", blob.url, tokenPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}

