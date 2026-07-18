import { Router } from "express";
import {
  getDashboardStats,
  getRecentCaptures,
  getWeeklyChart,
} from "../controllers/dashboard.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/stats", authMiddleware, getDashboardStats);

router.get(
  "/recent-captures",
  authMiddleware,
  getRecentCaptures
);

router.get(
  "/chart",
  authMiddleware,
  getWeeklyChart
);

export default router;