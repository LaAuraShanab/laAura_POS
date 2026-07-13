import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import { env } from "./config/env";
import { ok } from "./utils/response";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./modules/auth/auth.routes";
import { usersRouter } from "./modules/users/users.routes";
import { categoriesRouter } from "./modules/categories/categories.routes";
import { productsRouter } from "./modules/products/products.routes";
import { salesRouter } from "./modules/sales/sales.routes";
import { customersRouter } from "./modules/customers/customers.routes";
import { reportsRouter } from "./modules/reports/reports.routes";
import { auditRouter } from "./modules/audit/audit.routes";

export function createApp() {
  const app = express();

  // Render (and most PaaS hosts) sit the app behind exactly one reverse proxy.
  // Without this, req.ip resolves to that proxy's internal address for every
  // visitor — breaking both the audit log's IP column and the per-IP login
  // rate limiter, which would otherwise share one bucket across all users.
  app.set("trust proxy", 1);

  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(cookieParser());
  app.use(express.json());
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  app.get("/api/health", (req, res) => ok(res, { status: "ok" }));

  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/sales", salesRouter);
  app.use("/api/customers", customersRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/audit-logs", auditRouter);

  if (env.nodeEnv === "production") {
    const clientDist = path.join(process.cwd(), "..", "client", "dist");
    app.use(express.static(clientDist));
    app.use((req, res, next) => {
      if (req.method !== "GET" || req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
        return next();
      }
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
