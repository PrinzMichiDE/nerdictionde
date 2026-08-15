import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { UserProfile } from "@/components/tools/UserProfile";
import {
  Calendar,
  Type,
  Users,
  MessageSquare,
  Film,
  Image,
  BarChart3,
  Gamepad2,
  Heart,
  Users2,
  Settings,
  TrendingUp,
  Globe,
  Palette,
  Music,
  MapPin,
  Zap,
  Shield,
  Smartphone,
  Camera,
  Target,
  Sparkles,
  Clock,
  CheckSquare,
  Gift,
  Trophy,
  Bell,
  Scissors,
  Layout,
  Video,
  FileText,
  Link as LinkIcon,
  Hash,
  DollarSign,
  Receipt,
  TrendingDown,
  Bot,
  Calendar as CalendarIcon,
  Database,
  Megaphone,
  Star,
  Award,
  Brush,
  Type as TypeIcon,
  Smile,
  Badge,
  Puzzle,
  Volume2,
  Play,
  Shuffle,
  Vote,
  PartyPopper,
  HelpCircle,
  BookOpen,
  GlassWater,
  Activity,
  Eye,
  Timer,
  Moon,
  Mic,
  Handshake,
  CalendarCheck,
  UserCheck,
  FileCheck,
  Zap as ZapIcon,
  Code,
  Webhook,
  Plug,
  Brain,
  Cloud,
  BarChart,
  Search,
  CalendarDays,
  Split,
  Image as ImageIcon,
  Radio,
  RefreshCw,
  ArrowLeftRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

const toolCategories = [
  {
    name: "Core Streaming",
    icon: Gamepad2,
    tools: [
      { id: "title-generator", name: "Stream Title Generator", icon: Type, description: "Generiere optimierte Stream-Titel" },
      { id: "schedule-planner", name: "Stream Schedule Planner", icon: Calendar, description: "Plane deine Streams" },
      { id: "follower-tracker", name: "Follower Tracker", icon: Users, description: "Tracke Follower & Subscriber" },
      { id: "chat-commands", name: "Chat Commands", icon: MessageSquare, description: "Verwalte Chat-Befehle" },
      { id: "overlay-generator", name: "Overlay Generator", icon: Film, description: "Erstelle Stream-Overlays" },
      { id: "clip-organizer", name: "Clip Organizer", icon: Scissors, description: "Organisiere deine Clips" },
      { id: "analytics", name: "Stream Analytics", icon: BarChart3, description: "Analysiere deine Stream-Performance" },
      { id: "emote-manager", name: "Emote Manager", icon: Smile, description: "Verwalte deine Emotes" },
      { id: "alerts-setup", name: "Stream Alerts", icon: Bell, description: "Konfiguriere Stream-Alerts" },
      { id: "game-finder", name: "Game Finder", icon: Gamepad2, description: "Finde optimale Spiele-Kategorien" },
      { id: "tags-optimizer", name: "Tags Optimizer", icon: Hash, description: "Optimiere Stream-Tags" },
      { id: "countdown-timer", name: "Countdown Timer", icon: Timer, description: "Countdown bis zum Stream" },
      { id: "donation-tracker", name: "Donation Tracker", icon: DollarSign, description: "Tracke Spenden" },
      { id: "notes-generator", name: "Stream Notes", icon: FileText, description: "Generiere Stream-Notizen" },
    ],
  },
  {
    name: "IRL Streaming",
    icon: MapPin,
    tools: [
      { id: "location-tracker", name: "Location Tracker", icon: MapPin, description: "GPS-basiertes Location Tracking" },
      { id: "weather-overlay", name: "Weather Overlay", icon: Cloud, description: "Wetter-Widgets für Stream" },
      { id: "irl-route-planner", name: "IRL Route Planner", icon: MapPin, description: "Plane IRL Stream-Routen" },
      { id: "mobile-stream-setup", name: "Mobile Setup", icon: Smartphone, description: "Mobile Streaming Setup" },
      { id: "battery-tracker", name: "Battery Tracker", icon: Zap, description: "Akku-Monitoring" },
      { id: "network-monitor", name: "Network Monitor", icon: Radio, description: "Netzwerk-Geschwindigkeit" },
      { id: "irl-checklist", name: "IRL Checklist", icon: CheckSquare, description: "IRL Pre-Stream Checklist" },
      { id: "poi-finder", name: "POI Finder", icon: MapPin, description: "Points of Interest finden" },
      { id: "safety-manager", name: "Safety Manager", icon: Shield, description: "Sicherheits-Planung" },
    ],
  },
  {
    name: "Advanced Overlays",
    icon: Layout,
    tools: [
      { id: "webcam-frame", name: "Webcam Frame", icon: Camera, description: "Custom Webcam Rahmen" },
      { id: "chat-overlay", name: "Chat Overlay", icon: MessageSquare, description: "Chat-Anzeige Designer" },
      { id: "now-playing", name: "Now Playing", icon: Music, description: "Aktueller Song anzeigen" },
      { id: "goal-bar", name: "Goal Bar", icon: Target, description: "Sub/Follower Goal Bar" },
      { id: "hype-train", name: "Hype Train", icon: Sparkles, description: "Hype Train Visualisierung" },
      { id: "starting-soon", name: "Starting Soon", icon: Play, description: "Pre-Stream Screen" },
      { id: "brb-screen", name: "BRB Screen", icon: Clock, description: "Pause-Bildschirm" },
    ],
  },
  {
    name: "Social Media & Marketing",
    icon: Megaphone,
    tools: [
      { id: "social-scheduler", name: "Social Scheduler", icon: CalendarIcon, description: "Social Media Posts planen" },
      { id: "clip-converter", name: "Clip Converter", icon: Video, description: "Clips zu TikTok/Shorts" },
      { id: "hashtag-generator", name: "Hashtag Generator", icon: Hash, description: "Optimale Hashtags" },
      { id: "bio-link", name: "Bio Link", icon: LinkIcon, description: "Linktree-Alternative" },
    ],
  },
  {
    name: "Monetarisierung",
    icon: DollarSign,
    tools: [
      { id: "sponsor-pitch", name: "Sponsor Pitch", icon: Megaphone, description: "Sponsoring-Anfragen" },
      { id: "media-kit", name: "Media Kit", icon: FileText, description: "Professionelles Media Kit" },
      { id: "revenue-calculator", name: "Revenue Calculator", icon: DollarSign, description: "Einnahmen berechnen" },
      { id: "tax-tracker", name: "Tax Tracker", icon: Receipt, description: "Steuer-Tracking" },
    ],
  },
];

export default function ToolsPage() {
  // Session is verified by middleware
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <span className="kicker text-primary">Für Streamer & Creators</span>
          <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight mt-1 mb-2">Streaming Tools</h1>
          <p className="text-muted-foreground">
            Wähle ein Tool aus der Liste aus.
          </p>
        </div>
        <UserProfile />
      </div>

      <div className="space-y-8">
        {toolCategories.map((category) => {
          const Icon = category.icon;
          return (
            <div key={category.name}>
              <div className="flex items-center gap-2 mb-4">
                <Icon className="h-6 w-6 text-primary" />
                <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight">{category.name}</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {category.tools.map((tool) => {
                  const ToolIcon = tool.icon;
                  return (
                    <Link key={tool.id} href={`/tools/${tool.id}`}>
                      <Card className="h-full">
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <ToolIcon className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">{tool.name}</CardTitle>
                          </div>
                          <CardDescription>{tool.description}</CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
