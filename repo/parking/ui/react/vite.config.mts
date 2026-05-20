import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import * as path from "path";
import eslint from "vite-plugin-eslint2";

// Helper to create proxy config with Authorization header
function createProxyConfig(target: string, authToken?: string) {
  return {
    target,
    changeOrigin: true,
    configure: (proxy: any, _options: any) => {
      proxy.on("proxyReq", (proxyReq: any, _req: any, _res: any) => {
        if (authToken) {
          proxyReq.setHeader("Authorization", `c3auth=${authToken}`);
        }
      });
    },
  };
}

// Resolve the credentials directory relative to this config file's location.
// credentials/.env lives at <pkg-root>/credentials/.env, two levels up from ui/react/.
const credentialsDir = path.resolve(__dirname, "../../credentials");

export default defineConfig(({ command, mode }) => {
  // Load from both the credentials dir and the local dir (cwd) so C3-injected
  // VITE_C3_* vars are still picked up when the UI service sets them via process.env.
  const env = {
    ...loadEnv(mode, credentialsDir, "VITE_"),
    ...loadEnv(mode, process.cwd(), "VITE_"),
  };
  const port = parseInt(env.VITE_DEV_SERVER_PORT || "9000", 10);
  const pkgName = env.VITE_C3_PKG;
  const authToken = env.VITE_C3_AUTH_TOKEN;
  const appUrl = `${env.VITE_C3_BASE_URL}/${env.VITE_C3_ENV}/${env.VITE_C3_APP}/`;
  const base =
    command === "serve"
      ? `/${env.VITE_C3_ENV}/${env.VITE_C3_APP}/uiservice/`
      : "./";

  if (!pkgName) {
    // During C3-hosted dev/build, VITE_C3_PKG is injected automatically.
    // Fallback for local builds without C3 env vars.
    throw new Error("VITE_C3_PKG is not set — ensure the C3 environment is active or set it in .env");
  }

  return {
    // Load VITE_* vars from credentials/.env in addition to the default location.
    envDir: credentialsDir,
    plugins: [
      react(),
      eslint({
        lintOnStart: true,
        cache: false,
        include: ["src/**/*.{ts,tsx,js,jsx}"],
        exclude: [
          "node_modules/**",
          "dist/**",
          "build/**",
          "coverage/**",
          "assets/**",
          "src/**/__tests__/**",
          "src/**/*.test.{ts,tsx,js,jsx}",
        ],
      }),
    ],
    css: {
      postcss: "./postcss.config.js",
    },
    resolve: {
      alias: [{ find: "@", replacement: path.resolve(__dirname, "./src") }],
    },
    server: {
      host: true,
      allowedHosts: true,
      port: port,
      strictPort: true,
      proxy: {
        "^/api": createProxyConfig(appUrl, authToken),
        "^/remote": createProxyConfig(appUrl, authToken),
        "^/thirdparty": createProxyConfig(appUrl, authToken),
        "^/typesys": createProxyConfig(appUrl, authToken),
      },
    },
    base: base,
    build: {
      outDir: `../content/${pkgName}`,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          assetFileNames: "assets/[name][extname]",
          chunkFileNames: "assets/[name].js",
          entryFileNames: "assets/[name].js",
        },
        onwarn: (warning, warn) => {
          if (warning.code === "MODULE_LEVEL_DIRECTIVE") return;
          warn(warning);
        },
      },
    },
  };
});
