import { trpc } from "@/lib/trpc";
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from "@shared/const";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";

import App from "./App";
import { getLoginUrl } from "./const";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./index.css";

// Register Service Worker for PWA
// Disabled temporarily to fix cache issues
// if ("serviceWorker" in navigator) {
//   window.addEventListener("load", async () => {
//     try {
//       const registration = await navigator.serviceWorker.register("/sw.js");
//       console.log("Service Worker registered:", registration);
//
//       // Force update to clear old cache
//       if (registration.waiting) {
//         registration.waiting.postMessage({ type: "SKIP_WAITING" });
//       }
//     } catch (error) {
//       console.log("Service Worker registration failed:", error);
//     }
//   });
//
//   // Listen for controlling service worker
//   navigator.serviceWorker.addEventListener("controllerchange", () => {
//     window.location.reload();
//   });
// }

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) {
    return;
  }

  if (typeof window === "undefined") {
    return;
  }

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) {
    return;
  }

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;

    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;

    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,

      headers() {
        const headers: Record<string, string> = {};

        // Preview auto-login fallback:
        // when the browser blocks iframe cookies
        // (Safari ITP / private browsing / WebView),
        // the runtime mirrors the session into sessionStorage
        // so it can be forwarded as a Bearer token.
        try {
          const raw = sessionStorage.getItem("manus-cookie");

          if (raw) {
            const prefix = `${COOKIE_NAME}=`;

            const pair = raw
              .split(";")
              .find(item => item.trim().startsWith(prefix));

            const token = pair?.trim().slice(prefix.length);

            if (token) {
              headers.Authorization = `Bearer ${token}`;
            }
          }
        } catch {
          // sessionStorage unavailable
        }

        // Add access code for group authentication
        try {
          const accessCode = localStorage.getItem("aperosplit_access");

          if (accessCode) {
            headers["x-app-access-key"] = accessCode;
          }
        } catch {
          // localStorage unavailable
        }

        return headers;
      },

      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Élément HTML avec id="root" introuvable.');
}

createRoot(rootElement).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </trpc.Provider>
);