import { put } from "@vercel/blob";

export async function uploadImage(url: string, filename: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const { url: blobUrl } = await put(filename, blob, {
      access: "public",
      addRandomSuffix: true, // Generate unique filename to avoid conflicts
    });
    return blobUrl;
  } catch (error) {
    console.error("Error uploading image to Vercel Blob:", error);
    return url; // Fallback to original URL
  }
}

