import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import linkRoutes from "./routes/link.routes.js";
import captureRoutes from "./routes/capture.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";


dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://fwl7jvcq-3000.inc1.devtunnels.ms",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/link", linkRoutes);
app.use("/api/capture", captureRoutes);
app.use("/api/dashboard", dashboardRoutes);

export default app;