import express from "express";
import cors from "cors";
import { authMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./lib/logger";
import companiesRouter from "./routes/companies";
import documentsRouter from "./routes/documents";
import uploadRouter from "./routes/upload";
import shareRouter from "./routes/share";
import searchRouter from "./routes/search";
import adminRouter from "./routes/admin";

const app = express();
const PORT = process.env.PORT || 4000;

// Global middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Public routes (no auth required)
app.use("/api", shareRouter);
app.use("/api", companiesRouter);
app.use("/api", searchRouter);

// Protected routes (auth required)
app.use("/api", authMiddleware, documentsRouter);
app.use("/api", authMiddleware, uploadRouter);
app.use("/api", authMiddleware, adminRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API server running on http://localhost:${PORT}`);
});

export default app;
