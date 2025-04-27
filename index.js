import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import authRoutes from "./routes/auth.routes.js"
// import userRoutes from "./routes/user.routes.js"
import orderRoutes from "./routes/order.routes.js"
// import bookingRoutes from "./routes/booking.routes.js"
// import reviewRoutes from "./routes/review.routes.js"
import paymentRoutes from "./routes/payment.routes.js"
import supportRoutes from "./routes/support.routes.js"
import menuItemRoutes from "./routes/menu-item.route.js"
// Add import for notification routes
import notificationRoutes from "./routes/notification.routes.js"

import { errorHandler, notFound } from "./middlewares/error.middleware.js"
import { apiRateLimiter } from "./middlewares/rateLimiter.js"

// Add imports for fs and path
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { connectDB } from "./lib/DB.js"

dotenv.config()

// Add this after dotenv.config()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware Setup ---
app.use(cors());

// IMPORTANT: Remove the custom conditional middleware block for express.json()

// Apply JSON and URL-encoded limits GLOBALLY *before* routes
// These will apply to all routes EXCEPT the ones that specifically use a different body parser (like the Stripe webhook below)
app.use(express.json({ limit: '10mb' })); // Apply increased limit for JSON
app.use(express.urlencoded({ limit: '10mb', extended: true })); // Apply increased limit for URL-encoded

// Apply rate limiter (can usually come after body parsers)
// Keep your webhook exclusion logic here if needed for rate limiting
app.use((req, res, next) => {
  if (req.originalUrl === "/api/payments/webhook") {
    next();
  } else {
    apiRateLimiter(req, res, next);
  }
});


// --- Routes ---

// Stripe Webhook Route - Use express.raw specifically here BEFORE other payment routes might use express.json
// Make sure this route definition comes *before* the main '/api/payments' mount if it uses the same base path
app.post('/api/payments/webhook', express.raw({type: 'application/json'}), (req, res, next) => {
    
    console.log("Raw webhook processing route hit"); 
   
    res.status(200).send("Webhook handled placeholder"); 
});


// Mount other routes (these will use the global express.json with the 10mb limit)
app.use("/api/auth", authRoutes);
app.use('/api/menu-items', menuItemRoutes);
app.use("/api/payments", paymentRoutes); // Ensure this doesn't clash with the specific webhook route above
app.use("/api/support", supportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/orders", orderRoutes);



app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// Error handling middleware (comes last)
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  connectDB();
  console.log(`Server running on port ${PORT}`);
});

export default app;
