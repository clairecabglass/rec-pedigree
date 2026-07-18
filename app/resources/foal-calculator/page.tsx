import type { Metadata } from "next";
import FoalCalculatorClient from "./FoalCalculatorClient";

export const metadata: Metadata = {
  title: "Foal Coat Calculator · Redfield Equestrian Centre",
  description:
    "Free public coat genetics sandbox for The Rift. Pick a base, dilutions, and pattern for a hypothetical sire and dam, and see every coat their foal could produce.",
};

// Public, unauthenticated What-If genetics sandbox.
export default function FoalCalculatorPage() {
  return <FoalCalculatorClient />;
}
