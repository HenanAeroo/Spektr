import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// Build a Content-Security-Policy from the configured API origin so no dev
// values (localhost) ever leak into a production bundle (MISC-03). The ws/wss
// origin is derived from the API URL for the socket.io real-time channel.
function buildCsp(apiUrl: string, includeFrameAncestors: boolean): string {
  const wsOrigin = apiUrl.replace(/^http/, "ws");
  const directives: [string, string][] = [
    ["default-src", "'self'"],
    ["script-src", "'self'"],
    ["style-src", "'self' 'unsafe-inline' fonts.googleapis.com"],
    ["font-src", "'self' fonts.gstatic.com"],
    ["img-src", "'self' data:"],
    ["connect-src", `'self' ${apiUrl} ${wsOrigin}`],
    ["object-src", "'none'"],
    ["base-uri", "'none'"],
    ["form-action", "'self'"],
  ];
  // frame-ancestors is only honored in an HTTP header, not a <meta> tag — the
  // dev server sends it below, and the production static host must do the same.
  if (includeFrameAncestors) directives.push(["frame-ancestors", "'none'"]);
  return directives.map(([k, v]) => `${k} ${v}`).join("; ");
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const apiUrl = env.VITE_API_URL ?? "http://localhost:3001";

  return {
    plugins: [
      tanstackRouter({ routesDirectory: "./src/routes" }),
      react(),
      tailwindcss(),
      {
        // Inject the CSP <meta> into the production build output only; the dev
        // server enforces the (stricter, header-only) policy via headers below.
        name: "spektr-csp-meta",
        apply: "build",
        transformIndexHtml(html: string) {
          const meta = `<meta http-equiv="Content-Security-Policy" content="${buildCsp(
            apiUrl,
            false,
          )}" />`;
          return html.replace("</head>", `  ${meta}\n  </head>`);
        },
      },
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      port: 3000,
      headers: {
        "Content-Security-Policy": buildCsp(apiUrl, true),
      },
    },
  };
});
