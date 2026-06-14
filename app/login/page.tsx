import type { Metadata } from "next";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Sign In — Goat Pool",
  description: "Sign in or create a Goat Pool account to join or start a tennis survivor pool.",
};

export default function LoginPage() {
  return <LoginClient />;
}
