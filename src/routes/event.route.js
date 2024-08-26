// Import required modules and configuration
import multer from 'multer';
import express from "express";
import storage from '../config/multer.js';
import verifyToken from "../middlewares/authMiddleware.js";
import { getEvent, getFilteredEvents, addToFavourites, removeFromFavourites, getAllFavourites, getEventBookingDetails } from "../controllers/event.controller.js";

const upload = multer({ storage });

// Create a new router instance
const router = express.Router();

// ========================= events routes ===========================

router.get("/get", verifyToken, getEvent);





router.get("/filtered", verifyToken, getFilteredEvents);

router.get("/booking-details", verifyToken, getEventBookingDetails);

// ======================= favourite events routes =====================

router.get("/get-all-favourites", verifyToken, getAllFavourites);

router.post("/add-to-favourites", verifyToken, addToFavourites);

router.delete("/remove-from-favourites", verifyToken, removeFromFavourites);

// ========================= passes routes ===========================



// ========================== rooms routes ===========================



// =========================== food routes ===========================




// Export the router for use in the main application file
export default router; 