import { defineConfig } from "@hey-api/openapi-ts";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

if (!apiBaseUrl) {
  throw new Error("NEXT_PUBLIC_API_URL is required to generate the API client.");
}

export default defineConfig({
  input: `${apiBaseUrl.replace(/\/$/, "")}/openapi.json`,
  output: "src/lib/api/generated",
  plugins: [
    {
      name: "@hey-api/client-fetch",
      baseUrl: "",
    },
    "@hey-api/typescript",
    "@hey-api/sdk",
  ],
});
