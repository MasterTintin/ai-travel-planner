import express from "express";
import { generateTrip } from "../controllers/tripController.js";

const router = express.Router();
router.post("/generate-trip", generateTrip);

export default router;
