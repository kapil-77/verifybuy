import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv, mergeConfig } from "vite";
import { nitro } from "nitro/vite";

export default defineConfig((env) => {
  const { command, mode } = env;

  const plugins = [
    tailwindcss(),
    tanstackStart({
      server: { entry: "server" },
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
    }),
    viteReact(),
  ];

  if (command === "build") {
    plugins.push(
      nitro({
        defaultPreset: "cloudflare-module",
      }),
    );
  }

  const loadedEnv = loadEnv(mode, process.cwd(), "VITE_");
  const envDefine: Record<string, string> = {};
  for (const [key, value] of Object.entries(loadedEnv)) {
    envDefine[`import.meta.env.${key}`] = JSON.stringify(value);
  }

  const isDevBuild = command === "build" && mode === "development";

  const config = {
    define: envDefine,
    ...(isDevBuild
      ? {
          environments: {
            client: {
              define: { "process.env.NODE_ENV": JSON.stringify("development") },
            },
          },
          esbuild: { keepNames: true },
        }
      : {}),
    css: { transformer: "lightningcss" },
    resolve: {
      // Native tsconfig paths resolution (replaces the former
      // vite-tsconfig-paths plugin; kept alongside the explicit alias below).
      tsconfigPaths: true,
      alias: {
        "@": `${process.cwd()}/src`,
      },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
      ignoreOutdatedRequests: true,
    },
    plugins,
  };

  return mergeConfig(config, {
    server: { host: "::", port: 8080 },
  });
});
