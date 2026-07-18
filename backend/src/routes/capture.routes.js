import { Router } from "express";
import upload from "../config/multer.js";
import { captureImage } from "../controllers/capture.controller.js";

const router = Router();

router.post("/:token", upload.single("image"), captureImage);

export default router;