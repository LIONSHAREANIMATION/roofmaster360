import express from "express";
import type { Request, Response, NextFunction } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { registerRoutes } from "./routes";
import * as fs from "fs";
import * as path from "path";

const app = express();
const log = console.log;

const METRO_PORT = parseInt(process.env.METRO_PORT || "8082", 10);
const isDev = process.env.NODE_ENV === "development";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

function setupCors(app: express.Application) {
  app.use((req, res, next) => {
    const origins = new Set<string>();

    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }

    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }

    const origin = req.header("origin");

    if (origin && origins.has(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.header("Access-Control-Allow-Credentials", "true");
    }

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });
}

function setupBodyParsing(app: express.Application) {
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(express.urlencoded({ extended: false }));
}

function setupRequestLogging(app: express.Application) {
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      if (!path.startsWith("/api")) return;

      const duration = Date.now() - start;

      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    });

    next();
  });
}

function getAppName(): string {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}

function serveExpoManifest(platform: string, res: Response) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json",
  );

  if (!fs.existsSync(manifestPath)) {
    return res
      .status(404)
      .json({ error: `Manifest not found for platform: ${platform}` });
  }

  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");

  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}

function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName,
}: {
  req: Request;
  res: Response;
  landingPageTemplate: string;
  appName: string;
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;

  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);

  const html = landingPageTemplate
    .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
    .replace(/EXPS_URL_PLACEHOLDER/g, expsUrl)
    .replace(/APP_NAME_PLACEHOLDER/g, appName);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}

function configureExpoAndLanding(app: express.Application) {
  const websiteTemplatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "website.html",
  );
  const websiteTemplate = fs.readFileSync(websiteTemplatePath, "utf-8");

  const termsTemplatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "terms.html",
  );
  const termsTemplate = fs.existsSync(termsTemplatePath)
    ? fs.readFileSync(termsTemplatePath, "utf-8")
    : null;

  const privacyTemplatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "privacy.html",
  );
  const privacyTemplate = fs.existsSync(privacyTemplatePath)
    ? fs.readFileSync(privacyTemplatePath, "utf-8")
    : null;

  log("Serving responsive website with Expo manifest routing for mobile apps");

  app.get("/website", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(websiteTemplate);
  });

  app.get("/terms", (_req: Request, res: Response) => {
    if (termsTemplate) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(200).send(termsTemplate);
    } else {
      res.redirect("/");
    }
  });

  app.get("/privacy", (_req: Request, res: Response) => {
    if (privacyTemplate) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(200).send(privacyTemplate);
    } else {
      res.redirect("/");
    }
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }

    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }

    if (req.path === "/") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(websiteTemplate);
    }

    next();
  });

  app.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app.use("/assets", express.static(path.resolve(process.cwd(), "server", "public", "assets")));
  app.use(express.static(path.resolve(process.cwd(), "static-build")));

  if (isDev) {
    // Metro proxy that preserves full paths
    const metroPaths = [
      "/debugger-ui",
      "/json", 
      "/inspector",
      "/__metro_hmr",
      "/symbolicate",
      "/logs",
      "/index.bundle",
      "/status",
      "/client",
      "/node_modules",
    ];
    
    const metroProxy = createProxyMiddleware({
      target: `http://localhost:${METRO_PORT}`,
      changeOrigin: true,
      ws: true,
      logger: console,
    });
    
    // Use filter function to match paths while preserving full URL
    app.use((req, res, next) => {
      const shouldProxy = metroPaths.some(p => req.path.startsWith(p));
      if (shouldProxy) {
        return metroProxy(req, res, next);
      }
      next();
    });
    
    // Serve the app loader page at /app
    const appLoaderPath = path.resolve(process.cwd(), "server", "templates", "app-loader.html");
    const appLoaderTemplate = fs.readFileSync(appLoaderPath, "utf-8");
    
    app.get("/app", (req: Request, res: Response) => {
      const forwardedProto = req.header("x-forwarded-proto") || req.protocol || "https";
      const forwardedHost = req.header("x-forwarded-host") || req.get("host");
      const metroUrl = `${forwardedProto}://${forwardedHost}/expo-web`;
      
      const html = appLoaderTemplate.replace("METRO_URL_PLACEHOLDER", metroUrl);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(200).send(html);
    });
    
    // Proxy the actual Expo web app at /expo-web
    const expoWebProxy = createProxyMiddleware({
      target: `http://localhost:${METRO_PORT}`,
      changeOrigin: true,
      ws: true,
      pathRewrite: { "^/expo-web": "" },
    });
    app.use("/expo-web", expoWebProxy);

    log(`Proxying Metro dev endpoints to port ${METRO_PORT}`);
    log(`Web app available at /app route`);
  }

  // Production /app route - serves the static web bundle
  if (!isDev) {
    app.get("/app", (req: Request, res: Response) => {
      // In production, serve a page that loads the static web bundle
      const staticWebPath = path.resolve(process.cwd(), "static-build", "web", "index.html");
      
      if (fs.existsSync(staticWebPath)) {
        return res.sendFile(staticWebPath);
      }
      
      // Fallback: redirect to main website with message
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>RoofMaster 360 - Mobile App</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #1A2332 0%, #151D28 100%);
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              color: white;
              text-align: center;
              padding: 40px 20px;
            }
            .container { max-width: 500px; }
            h1 { font-size: 32px; margin-bottom: 20px; }
            h1 span { color: #FF6B35; }
            p { font-size: 18px; color: rgba(255,255,255,0.8); margin-bottom: 30px; line-height: 1.6; }
            .btn {
              display: inline-block;
              background: #FF6B35;
              color: white;
              padding: 16px 32px;
              border-radius: 12px;
              text-decoration: none;
              font-weight: 600;
              font-size: 18px;
              transition: transform 0.2s, box-shadow 0.2s;
            }
            .btn:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(255,107,53,0.4); }
            .note { margin-top: 40px; font-size: 14px; color: rgba(255,255,255,0.5); }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>RoofMaster <span>360</span></h1>
            <p>The mobile app experience is best on iOS and Android devices. Download Expo Go and scan the QR code to get started.</p>
            <a href="/" class="btn">Visit Our Website</a>
            <p class="note">For development testing, the web version is available when running locally.</p>
          </div>
        </body>
        </html>
      `);
    });
    
    log("Production /app route configured");
  }

  log("Expo routing: Checking expo-platform header on / and /manifest");
  log("Website also available at /website route");
}

function setupErrorHandler(app: express.Application) {
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const error = err as {
      status?: number;
      statusCode?: number;
      message?: string;
    };

    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";

    res.status(status).json({ message });

    throw err;
  });
}

(async () => {
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);

  configureExpoAndLanding(app);

  const server = await registerRoutes(app);

  setupErrorHandler(app);

  const port = parseInt(process.env.PORT || "8081", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`Express server serving on port ${port}`);
      if (isDev) {
        log(`Marketing website: http://localhost:${port}/`);
        log(`Metro dev server proxied from port ${METRO_PORT}`);
      }
    },
  );
})();
