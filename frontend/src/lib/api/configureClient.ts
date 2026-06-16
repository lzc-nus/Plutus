import { client } from "./generated/client.gen";

let isConfigured = false;

export function configureApiClient() {
  if (isConfigured) return;

  client.setConfig({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
    credentials: "include",
  });

  isConfigured = true;
}
