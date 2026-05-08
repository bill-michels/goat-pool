import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);
export const FROM = "Goat Pool <onboarding@resend.dev>";
export const appUrl = () =>
  process.env.NEXT_PUBLIC_APP_URL ?? "https://goat-pool.vercel.app";
