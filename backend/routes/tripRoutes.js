import express from "express";

import { generateTrip } from "../controllers/tripController.js";
import { saveTrip } from "../controllers/saveTripController.js";
import { getTrips } from "../controllers/getTripsController.js";
import { updateTrip } from "../controllers/updateTripController.js";
import { deleteTrip } from "../controllers/deleteTripController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/generate-trip", generateTrip);
router.post("/save-trip", authMiddleware, saveTrip);
router.get("/", authMiddleware, getTrips);
router.put("/:id", authMiddleware, updateTrip);
router.delete("/:id", authMiddleware, deleteTrip);

export default router;
