import { client } from "./generated/client.gen";
import { getApiBaseUrl } from "./baseUrl";

let isConfigured = false;

export function configureApiClient() {
  if (isConfigured) return;

  client.setConfig({
    baseUrl: getApiBaseUrl(),
    credentials: "include",
  });

  isConfigured = true;
}
