import type { Metadata } from "next";
import CoursePlannerClient from "./CoursePlannerClient";

export const metadata: Metadata = {
  title: "Course Planner · Redfield Equestrian Centre",
  description:
    "Drag-and-drop course designer for Show Jumping and Cross Country events on The Rift. Place fences, draw a track, and export a print-ready master plan.",
};

export default function CoursePlannerPage() {
  return <CoursePlannerClient />;
}
