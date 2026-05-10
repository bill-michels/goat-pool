import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);
export const FROM = "Goat Pool <noreply@goat-pool.com>";
export const appUrl = () =>
  process.env.NEXT_PUBLIC_APP_URL ?? "https://goat-pool.vercel.app";
