import type { Metadata } from "next";
import CompendiumClient from "./CompendiumClient";

export const metadata: Metadata = {
  title: "Equine Sports Compendium · Redfield Equestrian Centre",
  description:
    "A reference guide to English, Western, racing, and other equestrian sports — vocabulary, judging, and attire for each discipline.",
};

export default function SportsCompendiumPage() {
  return <CompendiumClient />;
}
