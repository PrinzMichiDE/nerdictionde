import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getLanguageFromRequest } from "@/lib/i18n";

export default async function MediadatenRedirectPage() {
  const headersList = await headers();
  const detectedLang = getLanguageFromRequest(undefined, headersList);
  redirect(`/mediadaten/${detectedLang}`);
}
