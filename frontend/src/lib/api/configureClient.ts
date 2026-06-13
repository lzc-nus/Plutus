import { client } from "./generated/client.gen";

let isConfigured = false;

export function configureApiClient() {
  if (isConfigured) return;

  client.setConfig({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000",
  });

  client.interceptors.request.use((request) => {
    if (typeof window === "undefined") {
      return request;
    }

    const token = localStorage.getItem("plutus_access_token");

    if (token) {
      request.headers.set("Authorization", `Bearer ${token}`);
    }

    return request;
  });

  isConfigured = true;
}