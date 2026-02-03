import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, Twitch } from "lucide-react";

export const metadata = {
  title: "Login - Nerdiction Tools",
  description: "Login mit deinem Twitch Account um auf die Streaming Tools zuzugreifen",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Gamepad2 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Nerdiction Streaming Tools
          </CardTitle>
          <CardDescription>
            Melde dich mit deinem Twitch Account an, um auf alle Tools zuzugreifen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action="/api/auth/twitch/login" method="GET">
            <Button
              type="submit"
              className="w-full"
              size="lg"
            >
              <Twitch className="mr-2 h-5 w-5" />
              Mit Twitch anmelden
            </Button>
          </form>
          <p className="text-sm text-muted-foreground text-center">
            Durch die Anmeldung stimmst du zu, dass wir auf deine öffentlichen Twitch-Daten zugreifen.
          </p>
          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Zurück zur Startseite
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
