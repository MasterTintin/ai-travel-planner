import express from "express";
import { generateTrip } from "../controllers/tripController.js";
import { saveTrip } from "../controllers/saveTripController.js";

const router = express.Router();

router.post("/generate-trip", generateTrip);

router.post("/save-trip", saveTrip);

export default router;
