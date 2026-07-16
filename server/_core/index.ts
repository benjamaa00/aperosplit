import "dotenv/config";
import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initializeDatabase } from "../db";
import { isValidGroupAccessKey } from "./trpc";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  if (process.env.NODE_ENV === "production" && (!process.env.GROUP_ACCESS_PIN || process.env.GROUP_ACCESS_PIN.length < 6)) {
    throw new Error("GROUP_ACCESS_PIN with at least 6 characters is required in production");
  }
  await initializeDatabase();
  const app = express();
  const server = createServer(app);
  app.set("trust proxy", 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(rateLimit({
    windowMs: 60_000,
    limit: 200,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || req.socket.remoteAddress || "unknown",
  }));
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "8mb" }));
  app.use(express.urlencoded({ limit: "8mb", extended: true }));
  app.get("/health", (_req, res) => res.status(200).json({ ok: true }));
  app.get("/access", (req, res) => {
    const requestedNext = typeof req.query.next === "string" ? req.query.next : "/";
    const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/";
    res.type("html").send(`<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Accès AperoSplit</title><style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#07080d;color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display",Inter,sans-serif;overflow:hidden}
body:before,body:after{content:"";position:fixed;width:320px;height:320px;border-radius:50%;filter:blur(90px);opacity:.35;z-index:-1}body:before{background:#446cff;top:-120px;right:-100px}body:after{background:#8b5cf6;bottom:-130px;left:-100px}
.card{width:min(100%,390px);padding:34px;border:1px solid rgba(255,255,255,.12);border-radius:32px;background:linear-gradient(145deg,rgba(255,255,255,.11),rgba(255,255,255,.055));backdrop-filter:blur(28px);box-shadow:0 30px 80px rgba(0,0,0,.45);text-align:center}.icon{width:68px;height:68px;margin:0 auto 22px;display:grid;place-items:center;border-radius:22px;background:linear-gradient(135deg,#5271ff,#8b5cf6);font-size:30px;box-shadow:0 14px 34px rgba(82,113,255,.3)}.eyebrow{color:#8da2ff;font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase}h1{font-size:34px;letter-spacing:-.04em;margin:8px 0 10px}p{color:#a5a6ad;font-size:14px;line-height:1.55;margin:0 0 26px}input{width:100%;padding:16px;border:1px solid rgba(255,255,255,.12);border-radius:17px;background:rgba(0,0,0,.24);color:white;text-align:center;font-size:18px;font-weight:650;letter-spacing:.16em;outline:none}input:focus{border-color:#6f87ff;box-shadow:0 0 0 4px rgba(82,113,255,.14)}button{width:100%;margin-top:14px;padding:16px;border:0;border-radius:17px;background:#5271ff;color:white;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 12px 28px rgba(82,113,255,.25)}
</style></head><body><form class="card" method="post" action="/access"><div class="icon">🔐</div><div class="eyebrow">Espace privé</div><h1>AperoSplit</h1><p>Entrez le code partagé avec les six membres du groupe.</p><input type="password" name="pin" minlength="6" required autofocus inputmode="numeric" autocomplete="current-password" placeholder="Code d’accès"><input type="hidden" name="next" value="${next.replaceAll('"', '&quot;')}"><button type="submit">Entrer dans le groupe</button></form></body></html>`);
  });
  app.post("/access", (req, res) => {
    const pin = typeof req.body?.pin === "string" ? req.body.pin : "";
    if (!isValidGroupAccessKey(pin)) {
      res.redirect(303, "/access");
      return;
    }
    const requestedNext = typeof req.body?.next === "string" ? req.body.next : "/";
    const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/";
    res.cookie("aperosplit_access", pin, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60 * 1000,
      path: "/",
    });
    res.redirect(303, next);
  });
  app.get("/", (req, res, next) => {
    const cookieHeader = req.headers.cookie ?? "";
    const pin = cookieHeader.match(/(?:^|;\s*)aperosplit_access=([^;]+)/)?.[1];
    if (!isValidGroupAccessKey(pin ? decodeURIComponent(pin) : "")) {
      res.redirect(302, `/access?next=${encodeURIComponent(req.originalUrl)}`);
      return;
    }
    next();
  });
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
