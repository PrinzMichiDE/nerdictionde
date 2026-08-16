import type { Metadata } from "next";
import TitleGeneratorClient from "./client";

export const metadata: Metadata = {
  title: "Stream Title Generator",
  description:
    "Generiere optimierte Stream-Titel für Twitch basierend auf Game, Thema und Stimmung. Kostenlos, schnell und unbegrenzt.",
  alternates: {
    canonical: "/tools/title-generator",
  },
};

export default function TitleGeneratorPage() {
  return <TitleGeneratorClient />;
}
