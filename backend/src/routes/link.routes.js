import { Router } from "express";
import {
  createLink,
  getAllLinks,
  getLinkByToken,
  updateLink,
  deleteLink,
} from "../controllers/link.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/create", authMiddleware, createLink);

router.get("/", authMiddleware, getAllLinks);

router.get("/:token", getLinkByToken);

router.put("/:id", authMiddleware, updateLink);

router.delete("/:id", authMiddleware, deleteLink);

export default router;