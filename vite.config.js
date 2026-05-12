import fs from "node:fs";
import path from "node:path";
import base44 from "@base44/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

function readBase44AppId(root) {
  try {
    const text = fs.readFileSync(path.join(root, "base44", ".app.jsonc"), "utf8");
    const m = text.match(/"id"\s*:\s*"([^"]+)"/);
    return m?.[1]?.trim() ?? "";
  } catch {
    return "";
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const root = process.cwd();
  const env = loadEnv(mode, root, "");
  const appIdFromRepo = readBase44AppId(root);

  const define = {};
  if (!env.VITE_BASE44_APP_ID && appIdFromRepo) {
    define["import.meta.env.VITE_BASE44_APP_ID"] = JSON.stringify(appIdFromRepo);
  }

  return {
    logLevel: "error",
    define,
    plugins: [
      base44({
        legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === "true",
        hmrNotifier: true,
        navigationNotifier: true,
        analyticsTracker: true,
        visualEditAgent: true,
      }),
      react(),
    ],
  };
});
