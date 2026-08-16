import type { Metadata } from "next";
import SchedulePlannerClient from "./client";

export const metadata: Metadata = {
  title: "Stream Schedule Planner",
  description:
    "Plane und verwalte deine Twitch-Stream-Termine mit dem kostenlosen Stream Schedule Planner - inklusive Wiederholungen und Tags.",
  alternates: {
    canonical: "/tools/schedule-planner",
  },
};

export default function SchedulePlannerPage() {
  return <SchedulePlannerClient />;
}
