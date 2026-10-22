import { SimpleOverlayTool } from "@/components/streaming/SimpleOverlayTool";

export const metadata = {
  title: "Countdown-Timer - Nerdiction",
  robots: { index: false, follow: false },
};

export default function CountdownTimerPage() {
  return (
    <SimpleOverlayTool
      template="countdown"
      backHref="/streaming-tools"
      backLabel="Zurück zu Streaming-Tools"
      title="Countdown-Timer"
      description="Live-Countdown bis zum Stream-Start – als OBS-Browser-Quelle."
      defaultTitle="Stream startet in"
      defaultSubtitle=""
    />
  );
}
