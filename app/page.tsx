import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Goat Pool — Tennis Survivor Pools",
  description:
    "Run a tennis survivor pool with your friends. Pick an athlete each round — lose a life if they lose. Last one standing wins.",
  openGraph: {
    title: "Goat Pool — Tennis Survivor Pools",
    description:
      "Run a tennis survivor pool with your friends. Pick an athlete each round — lose a life if they lose. Last one standing wins.",
    url: "https://goat-pool.com",
    siteName: "Goat Pool",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Goat Pool — Tennis Survivor Pools",
    description:
      "Run a tennis survivor pool with your friends. Pick an athlete each round — lose a life if they lose. Last one standing wins.",
  },
};

export default function HomePage() {
  return <HomeClient />;
}
