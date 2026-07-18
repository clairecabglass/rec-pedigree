import type { Metadata } from "next";
import ShowScoreboardClient from "./ShowScoreboardClient";

export const metadata: Metadata = {
  title: "Show Scoreboard · Redfield Equestrian Centre",
  description:
    "Live event scoreboard for Show Jumping and Cross Country competitions on The Rift. Judge controls, public spectator board, and PNG export.",
};

export default function ShowScoreboardPage() {
  return <ShowScoreboardClient />;
}
