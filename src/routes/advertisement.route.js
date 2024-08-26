// Import required modules and configuration
import multer from 'multer';
import express from "express";
import storage from '../config/multer.js';
import verifyToken from "../middlewares/authMiddleware.js";
import { getAdvertisement } from "../controllers/advertisement.controller.js";

const upload = multer({ storage });

const router = express.Router();

router.get("/get", verifyToken, getAdvertisement);



export default router;