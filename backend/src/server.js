import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import skillsRoutes from "./routes/skills.js";
import requestsRoutes from "./routes/requests.js";
import reviewsRoutes from "./routes/reviews.js";
import adminRoutes from "./routes/admin.js";
import reportsRoutes from "./routes/reports.js";

dotenv.config();
const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/skills", skillsRoutes);
app.use("/api/requests", requestsRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
