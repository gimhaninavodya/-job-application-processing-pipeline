import express from "express";
import { uploadFile } from "../controllers/fileController.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/upload", upload.single("cv"), uploadFile);

export default router;
