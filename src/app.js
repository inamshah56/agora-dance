// Import required modules and configuration
import express from "express";
import chalk from "chalk";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import compression from "compression";
import cookieParser from "cookie-parser";
import { nodeEnv, port } from "./config/initialConfig.js";
import { connectDB } from "./config/dbConfig.js";
import "./models/models.js";
import authRoutes from "./routes/auth.route.js"; // Make sure you have this import for auth routes
import eventRoutes from "./routes/event.route.js";
import ticketRoutes from "./routes/ticket.route.js";
import profileRoutes from "./routes/profile.route.js";
import advertisementRoutes from "./routes/advertisement.route.js";
import os from "os"
import path from "path"
import { fileURLToPath } from 'url';
import sendTestNotification from "./notifications/sendTestNotification.js";

// Initializing the app
const app = express();
app.use(cookieParser());

// Essential security headers with Helmet
app.use(helmet());

// Enable CORS with default settings
app.use(cors());

// Logger middleware for development environment
if (nodeEnv === "development") {
  app.use(morgan("dev"));
}

// Compress all routes
app.use(compression());

// Rate limiting to prevent brute-force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Built-in middleware for parsing JSON
app.use(express.json());

// static directories
// Convert import.meta.url to a file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/static', express.static(path.join(__dirname, '..', 'static')));

// Route for root path
app.get('/', (req, res) => {
  res.send("Welcome to Agora Dance");
});

// Route to send test notification 
app.post('/send-test-notification/', async (req, res) => {
  const fcmToken = req.body.fcmToken;
  if (!fcmToken) {
    return res.status(400).json({ message: "FCM token is required, key is 'fcmToken'" });
  }
  const response = await sendTestNotification(fcmToken, "This is title", "Body of the notification");
  res.status(200).json({ message: "Notification sent successfully", response });
});


// routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes)
app.use("/api/event", eventRoutes)
app.use("/api/ticket", ticketRoutes)
app.use("/api/advertisement", advertisementRoutes)

// Global error handler
app.use((err, req, res, next) => {
  console.error(chalk.red(err.stack));
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    error: {},
  });
});

// Database connection
connectDB();

// Function to get the IP address of the server
function getIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const alias of iface) {
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return '0.0.0.0'; // fallback in case IP address cannot be determined
}

// Server running
app.listen(port, () => {
  console.log(chalk.bgYellow.bold(` Server is listening at http://${getIPAddress()}:${port} `));
});