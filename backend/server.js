import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import promoRouter from "./routes/promoCodeRoute.js";
import reviewRouter from "./routes/reviewRoute.js";
import newsletterRoutes from "./routes/newsletterRoute.js";
// Add these imports
import notificationRoutes from "./routes/notificationRoute.js";
import PushSubscription from "./models/pushSubscriptionModel.js";


const app = express();
const port = process.env.PORT || 5000;

// ✅ 1. Connect to MongoDB
connectDB();

// ✅ 2. Setup CORS (before routes)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:2000",
  "https://0m8gw799-5173.uks1.devtunnels.ms",
  "https://overpolemical-paulette-lymphangiomatous.ngrok-free.dev",
  "https://rest-psi-ten.vercel.app", // Your Vercel frontend
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true); // ✅ Allow the request
      } else {
        console.warn("🚫 Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allowedHeaders: ["Content-Type", "Authorization", "token"], // <-- add 'token' here
    credentials: true,
  })
);

// ✅ 3. Handle Stripe webhook route (must use raw body)
app.post(
  "/api/order/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => next()
);

// ✅ 4. Parse JSON for all other routes
app.use(express.json());

// ✅ 5. Mount routers after middlewares
app.use("/api/order", orderRouter);
app.use("/api/food", foodRouter);
app.use("/images", express.static("uploads"));
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/review", reviewRouter);
app.use("/api/promo", promoRouter);
app.use("/api/newsletter", newsletterRoutes);
// Add this after other routes
app.use("/api/notifications", notificationRoutes);


// ✅ 6. Handle preflight (OPTIONS) requests globally
app.options("*", cors());

// ✅ 7. Basic test route
app.get("/", (req, res) => {
  res.send("✅ API Working and CORS Configured");
});



// ✅ 8. Start server
app.listen(port, () => {
  console.log(`🚀 Server started on port: ${port}`);
});
