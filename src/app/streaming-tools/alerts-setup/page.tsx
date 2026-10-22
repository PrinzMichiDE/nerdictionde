import { SimpleOverlayTool } from "@/components/streaming/SimpleOverlayTool";

export const metadata = {
  title: "Alert-Setup - Nerdiction",
  robots: { index: false, follow: false },
};

export default function AlertsSetupPage() {
  return (
    <SimpleOverlayTool
      template="alert"
      backHref="/streaming-tools"
      backLabel="Zurück zu Streaming-Tools"
      title="Alert-Setup"
      description="Generiere eine Follower/Sub-Alert-Box als transparente OBS-Browser-Quelle."
      defaultTitle="Nerdiction"
      defaultSubtitle="Neuer Follower"
    />
  );
}
